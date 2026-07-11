/**
 * POST /api/buyer/events
 *
 * Batch event insert.
 * Body: {
 *   sessionId: string;
 *   events: Array<{ type: string; metadata?: Record<string, unknown> }>
 * }
 */

import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { withErrorHandler } from "@/lib/api-error";
import { trackEvents } from "@/lib/analytics-forwarder";

// Rate limit: 30 event batches per minute per IP
const limiter = rateLimit({ limit: 30, window: "60s" });

const ALLOWED_TYPES = new Set([
  "PAGE_LOAD",
  "TAB_VIEW",
  "SCROLL_25",
  "SCROLL_50",
  "SCROLL_75",
  "SCROLL_100",
  "CTA_CLICK",
  "LINK_CLICK",
  "FILE_DOWNLOAD",
  "SESSION_END",
]);

const MAX_EVENTS_PER_BATCH = 50;

export const POST = withErrorHandler(async (req: NextRequest) => {
  try {
    // Rate limit check
    const ip = getClientIp(req);
    const { success } = await limiter.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const { sessionId, events } = body as {
      sessionId?: string;
      events?: Array<{ type: string; metadata?: Record<string, unknown> }>;
    };

    if (!sessionId || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "Missing sessionId or events" }, { status: 400 });
    }

    if (events.length > MAX_EVENTS_PER_BATCH) {
      return NextResponse.json({ error: "Too many events" }, { status: 400 });
    }

    // Filter to allowed types once; reuse for both the DB write and forwarding.
    const allowed = events.filter((e) => ALLOWED_TYPES.has(e.type));
    const validEvents = allowed.map((e) => ({
      sessionId,
      type: e.type,
      metadata: JSON.stringify(e.metadata ?? {}),
    }));

    if (validEvents.length === 0) {
      return NextResponse.json({ inserted: 0 });
    }

    try {
      // FK constraint on sessionId validates the session exists — no separate lookup needed
      await prisma.buyerEvent.createMany({ data: validEvents });
    } catch {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Mirror to product analytics, keyed by the session's visitor hash so buyer
    // events stitch onto the same profile as the session. The lookup + send run
    // off the response path; no-op unless a provider is configured.
    after(async () => {
      try {
        const session = await prisma.buyerSession.findUnique({
          where: { id: sessionId },
          select: {
            pageId: true,
            visitor: { select: { visitorHash: true, contactId: true } },
          },
        });
        const visitorHash = session?.visitor?.visitorHash;
        if (!visitorHash) return;
        await trackEvents(
          allowed.map((e) => ({
            distinctId: visitorHash,
            event: `buyer_${e.type.toLowerCase()}`,
            properties: {
              pageId: session.pageId,
              contactId: session.visitor?.contactId ?? null,
              ...(e.metadata ?? {}),
            },
          }))
        );
      } catch (err) {
        console.error("[buyer/events forward]", err);
      }
    });

    return NextResponse.json({ inserted: validEvents.length });
  } catch (err) {
    console.error("[buyer/events POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
