import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { processImportedPage } from "@/lib/import-processor";

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
  const result = await processImportedPage(pageId, session.user.id);
  if (result.error === "Not found") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (result.code === "INSUFFICIENT_CREDITS") {
    return NextResponse.json(result, { status: 403 });
  }
  return NextResponse.json(result);
}
