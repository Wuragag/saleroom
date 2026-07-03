/**
 * Session replay endpoints — opt-in per page (Page.recordingEnabled).
 *
 * POST /api/buyer/session/[sessionId]/recording?c=<chunkIndex>
 *   Ingest one rrweb event chunk (public tracking endpoint, mirrors the other
 *   buyer/* write routes: bot-filtered, rate-limited, published+opt-in gated).
 *   The request body IS the events array — chunkIndex rides in the query string
 *   so the raw body can be stored verbatim without a parse/re-serialize cycle.
 *
 * GET /api/buyer/session/[sessionId]/recording
 *   Owner/team-authenticated read. Stored chunks are already JSON arrays, so
 *   the response is assembled by concatenating the raw strings — no per-chunk
 *   parse + re-stringify of a potentially large recording.
 *
 * Chunks are stored in Postgres (SessionRecording.data), not Blob storage —
 * this project's Vercel Blob store is provisioned public-only, and recording
 * data (buyer DOM/mouse activity) should carry the same authenticated-read-only
 * privacy model as the rest of the buyer analytics data rather than live at a
 * bare (if unguessable) public URL.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPageAccess } from "@/lib/team-auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { withErrorHandler } from "@/lib/api-error";
import { isBotUserAgent } from "@/lib/bot-detect";

// Rate limit: 20 chunk uploads per minute per IP (client flushes ~every 20s)
const limiter = rateLimit({ limit: 20, window: "60s", prefix: "recording" });

const MAX_EVENTS_PER_CHUNK = 2000;
const MAX_PAYLOAD_BYTES = 3 * 1024 * 1024; // 3MB per chunk (Postgres TOAST handles this fine)
// Hard cap on recording length per session: at a ~20s flush cadence this
// bounds a single session to ~40 minutes of recorded data.
const MAX_CHUNKS_PER_SESSION = 120;

export const POST = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) => {
  if (isBotUserAgent(req.headers.get("user-agent"))) {
    return NextResponse.json({ skipped: true });
  }

  const ip = getClientIp(req);
  const { success } = await limiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { sessionId } = await params;
  const cParam = req.nextUrl.searchParams.get("c");
  const chunkIndex = Number(cParam);
  // Guard explicitly: Number(null) and Number("") are both 0, which would
  // silently write to chunk 0 when the param is missing.
  if (cParam === null || cParam === "" || !Number.isInteger(chunkIndex) || chunkIndex < 0) {
    return NextResponse.json({ error: "chunkIndex required" }, { status: 400 });
  }
  // Cap check before reading the body — no point buffering a 3MB chunk to drop it.
  if (chunkIndex >= MAX_CHUNKS_PER_SESSION) {
    return NextResponse.json({ ok: true, capped: true });
  }

  const rawBody = await req.text();
  // Byte-accurate size gate (rawBody.length counts UTF-16 code units, which
  // undercounts multi-byte content by up to ~3x).
  if (Buffer.byteLength(rawBody, "utf8") > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  // Body is the events array; a malformed body throws → withErrorHandler → 400.
  const events = JSON.parse(rawBody) as unknown[];
  if (!Array.isArray(events) || events.length === 0) {
    return NextResponse.json({ error: "events required" }, { status: 400 });
  }
  if (events.length > MAX_EVENTS_PER_CHUNK) {
    return NextResponse.json({ error: "Too many events in chunk" }, { status: 400 });
  }

  const session = await prisma.buyerSession.findUnique({
    where: { id: sessionId },
    select: { id: true, pageId: true },
  });
  if (!session) {
    return NextResponse.json({ error: "Recording not available" }, { status: 404 });
  }

  const page = await prisma.page.findUnique({
    where: { id: session.pageId },
    select: { published: true, recordingEnabled: true },
  });
  if (!page?.published || !page.recordingEnabled) {
    return NextResponse.json({ error: "Recording not available" }, { status: 404 });
  }

  // Store the raw array string verbatim — GET stitches these back together.
  await prisma.sessionRecording.upsert({
    where: { sessionId_chunkIndex: { sessionId, chunkIndex } },
    update: { data: rawBody, eventCount: events.length },
    create: { sessionId, chunkIndex, data: rawBody, eventCount: events.length },
  });

  return NextResponse.json({ ok: true });
});

export const GET = withErrorHandler(async (
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) => {
  const { sessionId } = await params;

  const session = await prisma.buyerSession.findUnique({
    where: { id: sessionId },
    select: { id: true, pageId: true },
  });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const access = await checkPageAccess(session.pageId, "view");
  if (!access.authorized) {
    const status = !access.session ? 401 : access.reason === "Page not found" ? 404 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  const chunks = await prisma.sessionRecording.findMany({
    where: { sessionId },
    orderBy: { chunkIndex: "asc" },
    select: { data: true, eventCount: true },
  });

  // Each chunk.data is a compact JSON array string ("[...]"). Stitch them into
  // one array by dropping the outer brackets and joining — no parse/re-stringify.
  const inner = chunks
    .map((c) => c.data)
    .filter((d) => d.length > 2) // skip "[]" and empties
    .map((d) => d.slice(1, -1))
    .join(",");
  const eventCount = chunks.reduce((n, c) => n + c.eventCount, 0);

  return new NextResponse(`{"events":[${inner}],"eventCount":${eventCount}}`, {
    headers: { "content-type": "application/json" },
  });
});
