import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// This is a SEPARATE serverless function with its own timeout.
// On Vercel Hobby: 60s, Pro: up to 300s.
export const maxDuration = 60;

const AI_MODEL = "claude-sonnet-4-6";

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
 * Step 2: AI processing endpoint — called by the frontend as a separate
 * serverless invocation so it gets its own full maxDuration timeout.
 *
 * Reads extracted text from DB, sends to Claude, saves result.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pageId } = await params;

  // Load the page with stored extracted text
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: {
      id: true,
      userId: true,
      importStatus: true,
      importText: true,
    },
  });

  if (!page || page.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (page.importStatus !== "processing") {
    // Already processed or errored — no-op
    return NextResponse.json({ status: page.importStatus });
  }

  if (!page.importText) {
    await prisma.page.update({
      where: { id: pageId },
      data: {
        importStatus: "error",
        importError: "No extracted text found. Please re-upload.",
      },
    });
    return NextResponse.json({ status: "error", error: "No extracted text" });
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Convert the following document text into Tiptap JSON:\n\n${page.importText}`,
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
      console.error(
        "Claude response was not valid JSON:",
        responseText.slice(0, 500)
      );
      await prisma.page.update({
        where: { id: pageId },
        data: {
          importStatus: "error",
          importError: "Failed to process document. AI returned invalid output.",
          importText: null, // Clean up stored text
        },
      });
      return NextResponse.json({ status: "error" });
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
          importError:
            "Failed to process document. AI returned unexpected structure.",
          importText: null,
        },
      });
      return NextResponse.json({ status: "error" });
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
        importText: null, // Clean up stored text
        tabs: {
          updateMany: {
            where: { pageId },
            data: { content: contentJson },
          },
        },
      },
    });

    return NextResponse.json({ status: "complete" });
  } catch (err) {
    console.error("AI processing error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    await prisma.page.update({
      where: { id: pageId },
      data: {
        importStatus: "error",
        importError: `AI processing failed: ${errorMessage}`,
        importText: null,
      },
    });
    return NextResponse.json({ status: "error", error: errorMessage });
  }
}
