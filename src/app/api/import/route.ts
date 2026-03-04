import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserTeamId } from "@/lib/team-auth";
import { canCreatePage } from "@/lib/plan-limits";
import { extractText, isSupportedType } from "@/lib/document-parser";
import { DEFAULT_TAB_NAME } from "@/lib/constants";
import slugify from "slugify";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const AI_MODEL = "claude-sonnet-4-6";
const AI_TIMEOUT_MS = 55_000; // 55s — leave headroom for Vercel's 60s Pro limit

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

    // Extract text from document
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text: string;
    try {
      text = await extractText(buffer, file.type);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json({ error: message }, { status: 422 });
    }

    // Call Claude API with timeout
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create(
      {
        model: AI_MODEL,
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Convert the following document text into Tiptap JSON:\n\n${text}`,
          },
        ],
      },
      { signal: AbortSignal.timeout(AI_TIMEOUT_MS) }
    );

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
      return NextResponse.json(
        { error: "Failed to process document. Please try again." },
        { status: 502 }
      );
    }

    if (
      !parsed.title ||
      !parsed.content ||
      (parsed.content as { type?: string }).type !== "doc"
    ) {
      return NextResponse.json(
        { error: "Failed to process document. Please try again." },
        { status: 502 }
      );
    }

    // Create page with converted content
    const title = parsed.title.slice(0, 200);
    let slug = generateSlug(title);

    // Retry if slug collision
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.page.findUnique({ where: { slug } });
      if (!existing) break;
      slug = generateSlug(title);
      attempts++;
    }

    const contentJson = JSON.stringify(parsed.content);

    const page = await prisma.page.create({
      data: {
        title,
        slug,
        content: contentJson,
        userId: session.user.id,
        teamId,
        tabs: {
          create: {
            name: DEFAULT_TAB_NAME,
            order: 0,
            content: contentJson,
          },
        },
      },
    });

    return NextResponse.json(
      { id: page.id, title: page.title, slug: page.slug },
      { status: 201 }
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
