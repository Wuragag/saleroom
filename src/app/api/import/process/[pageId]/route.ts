import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// This is a SEPARATE serverless function with its own timeout.
// On Vercel Hobby: 60s, Pro: up to 300s.
export const maxDuration = 60;

const AI_MODEL = "claude-haiku-4-5-20251001";

// Each call is a paid 16K-token completion — cap per user.
const processLimiter = rateLimit({ limit: 10, window: "60s", prefix: "import-process" });

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
  request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit per user — each successful call is a paid LLM completion.
  const { success } = await processLimiter.limit(
    `${session.user.id}:${getClientIp(request)}`
  );
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429 }
    );
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

  // Atomically claim the job: only the request that flips "processing" → a
  // claimed state proceeds to the paid LLM call. Concurrent replays match 0
  // rows and return the current status without firing duplicate completions.
  const claim = await prisma.page.updateMany({
    where: { id: pageId, userId: session.user.id, importStatus: "processing" },
    data: { importStatus: "generating" },
  });
  if (claim.count === 0) {
    const fresh = await prisma.page.findUnique({
      where: { id: pageId },
      select: { importStatus: true },
    });
    return NextResponse.json({ status: fresh?.importStatus ?? "complete" });
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

    // Retry with exponential backoff for transient errors (overloaded, rate limits)
    const MAX_RETRIES = 3;
    let message: Anthropic.Message | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        message = await anthropic.messages.create({
          model: AI_MODEL,
          max_tokens: 16384,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Convert the following document text into Tiptap JSON:\n\n${page.importText}`,
            },
          ],
        });
        break; // Success — exit retry loop
      } catch (retryErr: unknown) {
        const status = (retryErr as { status?: number })?.status;
        const isRetryable = status === 429 || status === 529 || status === 503;

        if (!isRetryable || attempt === MAX_RETRIES - 1) throw retryErr;

        // Wait before retrying: 2s, 4s, 8s
        const delay = Math.pow(2, attempt + 1) * 1000;
        console.log(`Anthropic API returned ${status}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    if (!message) throw new Error("No response from AI after retries");

    // Extract text from Claude response
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Robust JSON extraction — handle code fences, preamble text, etc.
    let parsed: { title: string; content: Record<string, unknown> } | null =
      null;

    const extractJson = (text: string) => {
      let str = text.trim();

      // Strip code fences: handle both complete (```json...```) and truncated (```json... no closing)
      if (str.startsWith("```")) {
        const firstNewline = str.indexOf("\n");
        if (firstNewline !== -1) str = str.slice(firstNewline + 1);
      }
      if (str.endsWith("```")) {
        str = str.slice(0, -3);
      }
      str = str.trim();

      // 1. Try parsing directly
      try {
        return JSON.parse(str);
      } catch {
        // 2. Try to find the outermost JSON object { ... }
        const firstBrace = str.indexOf("{");
        const lastBrace = str.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          try {
            return JSON.parse(str.slice(firstBrace, lastBrace + 1));
          } catch {
            return null;
          }
        }
        return null;
      }
    };

    parsed = extractJson(responseText);

    if (!parsed) {
      console.error(
        "Claude response was not valid JSON:",
        responseText.slice(0, 500)
      );
      await prisma.page.update({
        where: { id: pageId },
        data: {
          importStatus: "error",
          importError: `AI returned invalid output. Raw start: ${responseText.slice(0, 120)}`,
          importText: null,
        },
      });
      return NextResponse.json({ status: "error" });
    }

    if (
      !parsed.title ||
      !parsed.content ||
      (parsed.content as { type?: string }).type !== "doc"
    ) {
      const keys = Object.keys(parsed).join(", ");
      const contentType = parsed.content
        ? (parsed.content as { type?: string }).type
        : "missing";
      await prisma.page.update({
        where: { id: pageId },
        data: {
          importStatus: "error",
          importError: `Unexpected structure: keys=[${keys}], content.type=${contentType}`,
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
