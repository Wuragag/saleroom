import { NextResponse, after } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserTeamId } from "@/lib/team-auth";
import { canCreatePage } from "@/lib/plan-limits";
import { extractText, isSupportedType } from "@/lib/document-parser";
import { DEFAULT_TAB_NAME } from "@/lib/constants";
import slugify from "slugify";

// Allow up to 60s — after() keeps the function alive for background work
export const maxDuration = 60;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const AI_MODEL = "claude-sonnet-4-6";

function generateSlug(title: string): string {
  const base = slugify(title, { lower: true, strict: true }) || "imported";
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

const SYSTEM_PROMPT = `You are a document-to-Tiptap converter. You receive raw text extracted from a document (PDF, DOCX, or PPTX) and must convert it into a Tiptap-compatible JSON structure.

Your output MUST be valid JSON with this exact shape:
{
  "title": "Short descriptive title inferred from the document",
  "content": {
    "type": "doc",
    "content": [ ... ]
  }
}

Supported Tiptap node types you can use:
- heading: { "type": "heading", "attrs": { "level": 1|2|3 }, "content": [{ "type": "text", "text": "..." }] }
- paragraph: { "type": "paragraph", "content": [{ "type": "text", "text": "..." }] }
- bulletList: contains listItem children
- orderedList: contains listItem children
- listItem: { "type": "listItem", "content": [{ "type": "paragraph", "content": [...] }] }
- blockquote: contains paragraph children
- table: contains tableRow children
- tableRow: contains tableHeader or tableCell children
- tableHeader: { "type": "tableHeader", "content": [{ "type": "paragraph", "content": [...] }] }
- tableCell: { "type": "tableCell", "content": [{ "type": "paragraph", "content": [...] }] }
- horizontalRule: { "type": "horizontalRule" }
- codeBlock: { "type": "codeBlock", "content": [{ "type": "text", "text": "..." }] }

Supported text marks:
- bold: { "type": "text", "marks": [{ "type": "bold" }], "text": "..." }
- italic: { "type": "text", "marks": [{ "type": "italic" }], "text": "..." }
- link: { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "..." } }], "text": "..." }
- code: { "type": "text", "marks": [{ "type": "code" }], "text": "..." }

Rules:
1. Infer a short, descriptive title from the document content (max 80 characters).
2. Preserve the document's structure: headings, lists, tables, paragraphs.
3. Clean up extraction artifacts (extra whitespace, page numbers, headers/footers).
4. If the document has clear sections, use heading nodes to separate them.
5. Return ONLY the JSON object — no markdown, no code fences, no explanation.
6. Every paragraph and heading must have a "content" array with at least one text node. Empty paragraphs should have no "content" key or an empty array.`;

/**
 * Background AI processing — runs after the response is sent via after().
 */
async function processImportInBackground(pageId: string, documentText: string) {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Convert the following document text into Tiptap JSON:\n\n${documentText}`,
        },
      ],
    });

    // Extract text from Claude response
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Strip markdown code fences if Claude wrapped the JSON
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    // Parse the JSON response
    let parsed: { title: string; content: Record<string, unknown> };
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Claude response was not valid JSON:", responseText.slice(0, 500));
      await prisma.page.update({
        where: { id: pageId },
        data: {
          importStatus: "error",
          importError: "Failed to process document. AI returned invalid output.",
        },
      });
      return;
    }

    if (
      !parsed.title ||
      !parsed.content ||
      (parsed.content as { type?: string }).type !== "doc"
    ) {
      await prisma.page.update({
        where: { id: pageId },
        data: {
          importStatus: "error",
          importError: "Failed to process document. AI returned unexpected structure.",
        },
      });
      return;
    }

    // Update page with converted content
    const title = parsed.title.slice(0, 200);
    const contentJson = JSON.stringify(parsed.content);

    await prisma.page.update({
      where: { id: pageId },
      data: {
        title,
        content: contentJson,
        importStatus: "complete",
        importError: null,
        tabs: {
          updateMany: {
            where: { pageId },
            data: { content: contentJson },
          },
        },
      },
    });
  } catch (err) {
    console.error("Background import error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    try {
      await prisma.page.update({
        where: { id: pageId },
        data: {
          importStatus: "error",
          importError: `Import failed: ${errorMessage}`,
        },
      });
    } catch (updateErr) {
      console.error("Failed to update page with error status:", updateErr);
    }
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = await getUserTeamId(session.user.id);

  // Plan limit check
  if (teamId) {
    const limitCheck = await canCreatePage(teamId);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: limitCheck.reason,
          code: "PLAN_LIMIT",
          current: limitCheck.current,
          limit: limitCheck.limit,
        },
        { status: 403 }
      );
    }
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!isSupportedType(file.type)) {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Please upload a PDF, DOCX, or PPTX file.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File must be under 10 MB" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI features are not configured. Please contact support." },
        { status: 503 }
      );
    }

    // Extract text from document (fast — runs synchronously before response)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text: string;
    try {
      text = await extractText(buffer, file.type);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json({ error: message }, { status: 422 });
    }

    // Create page immediately with "processing" status
    const placeholderTitle = "Importing document…";
    let slug = generateSlug("imported");

    // Retry if slug collision
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.page.findUnique({ where: { slug } });
      if (!existing) break;
      slug = generateSlug("imported");
      attempts++;
    }

    const placeholderContent = JSON.stringify({
      type: "doc",
      content: [{ type: "paragraph" }],
    });

    const page = await prisma.page.create({
      data: {
        title: placeholderTitle,
        slug,
        content: placeholderContent,
        importStatus: "processing",
        userId: session.user.id,
        teamId,
        tabs: {
          create: {
            name: DEFAULT_TAB_NAME,
            order: 0,
            content: placeholderContent,
          },
        },
      },
    });

    // Schedule AI processing to run AFTER the response is sent
    after(() => processImportInBackground(page.id, text));

    // Return immediately — frontend will poll for status
    return NextResponse.json(
      { id: page.id, status: "processing" },
      { status: 202 }
    );
  } catch (err) {
    console.error("Import error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Import failed: ${message}` },
      { status: 500 }
    );
  }
}
