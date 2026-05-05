import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-auth";
import { retryWithBackoff } from "@/lib/retry";
import { extractFirstJsonObject, isAnthropicRetryableError } from "@/lib/ai-output";

// Separate serverless function with its own timeout.
export const maxDuration = 60;

const AI_MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `You are a professional page writer for a sales enablement platform. You receive a user's description of a page they want to create, and you must generate a complete, polished Tiptap-compatible JSON page.

Your output MUST be valid JSON with this exact shape:
{
  "title": "Short descriptive title for the page (max 80 chars)",
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
1. Generate a professional, well-structured page based on the user's description.
2. Create a concise, descriptive title (max 80 characters).
3. Use headings (h1 for main title, h2 for sections, h3 for subsections) to organize content.
4. Include realistic, professional content — not placeholder "Lorem ipsum" text.
5. Use formatting (bold, italic, lists, tables) where appropriate for the content type.
6. For sales pages: include compelling copy, clear value propositions, and structured sections.
7. Return ONLY the JSON object — no markdown, no code fences, no explanation.
8. Every paragraph and heading must have a "content" array with at least one text node. Empty paragraphs should have no "content" key or an empty array.`;

/**
 * POST /api/ai-write/process/[pageId]
 * Reads the user's prompt from DB, calls Claude, saves generated content.
 */
export const POST = withAuth<{ pageId: string }>(async (_request, { params, session }) => {
  const { pageId } = await params;

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
    return NextResponse.json({ status: page.importStatus });
  }

  if (!page.importText) {
    // No prompt — delete the broken page
    await prisma.page.delete({ where: { id: pageId } });
    return NextResponse.json({ status: "error", error: "No prompt found. Please try again." });
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await retryWithBackoff(
      () =>
        anthropic.messages.create({
          model: AI_MODEL,
          max_tokens: 16384,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Generate a page based on this description:\n\n${page.importText}`,
            },
          ],
        }),
      {
        attempts: 3,
        isRetryable: isAnthropicRetryableError,
        onRetry: (err, attempt, delayMs) => {
          const status = (err as { status?: number })?.status;
          console.log(
            `Anthropic API returned ${status}, retrying in ${delayMs}ms (attempt ${attempt}/3)`
          );
        },
      }
    );

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    const parsed = extractFirstJsonObject<{
      title: string;
      content: Record<string, unknown>;
    }>(responseText);

    if (!parsed) {
      console.error(
        "Claude response was not valid JSON:",
        responseText.slice(0, 500)
      );
      // Delete the page — don't leave broken pages in dashboard
      await prisma.page.delete({ where: { id: pageId } });
      return NextResponse.json({
        status: "error",
        error: "AI returned invalid output. Please try again.",
      });
    }

    if (
      !parsed.title ||
      !parsed.content ||
      (parsed.content as { type?: string }).type !== "doc"
    ) {
      // Delete the page — don't leave broken pages in dashboard
      await prisma.page.delete({ where: { id: pageId } });
      return NextResponse.json({
        status: "error",
        error: "AI generated an unexpected format. Please try again.",
      });
    }

    // Update page with generated content
    const title = parsed.title.slice(0, 200);
    const contentJson = JSON.stringify(parsed.content);

    await prisma.page.update({
      where: { id: pageId },
      data: {
        title,
        content: contentJson,
        importStatus: "complete",
        importError: null,
        importText: null,
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
    console.error("AI Write processing error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    // Delete the page — don't leave broken pages in dashboard
    try {
      await prisma.page.delete({ where: { id: pageId } });
    } catch {
      // Page may already be deleted — ignore
    }
    return NextResponse.json({
      status: "error",
      error: `AI generation failed: ${errorMessage}`,
    });
  }
});
