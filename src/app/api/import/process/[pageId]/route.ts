import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserTeamId } from "@/lib/team-auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { AI_CREDIT_COSTS, InsufficientCreditsError, chargeCredits } from "@/lib/ai-credits";
import {
  buildImportSystemPrompt,
  callClaudeWithRetries,
  extractJson,
} from "@/lib/ai-page-generation";

// This is a SEPARATE serverless function with its own timeout.
// On Vercel Hobby: 60s, Pro: up to 300s.
export const maxDuration = 60;

// Each call is a paid 16K-token completion — cap per user.
const processLimiter = rateLimit({ limit: 10, window: "60s", prefix: "import-process" });

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
    const teamId = await getUserTeamId(session.user.id);
    await chargeCredits(teamId, session.user.id, AI_CREDIT_COSTS.import);

    const responseText = await callClaudeWithRetries({
      system: buildImportSystemPrompt(),
      messages: [
        {
          role: "user",
          content: `Convert the following document text into Tiptap JSON:\n\n${page.importText}`,
        },
      ],
    });

    // Robust JSON extraction — handle code fences, preamble text, etc.
    const parsed = extractJson(responseText) as {
      title?: string;
      content?: Record<string, unknown>;
    } | null;

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

    if (err instanceof InsufficientCreditsError) {
      await prisma.page.update({
        where: { id: pageId },
        data: {
          importStatus: "error",
          importError: err.message,
          importText: null,
        },
      });
      return NextResponse.json(
        { status: "error", error: err.message, code: err.code },
        { status: 403 }
      );
    }

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
