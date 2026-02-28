/**
 * POST /api/buyer/events
 *
 * Batch event insert.
 * Body: {
 *   sessionId: string;
 *   events: Array<{ type: string; metadata?: Record<string, unknown> }>
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function POST(req: NextRequest) {
  try {
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

    // Validate session exists
    const session = await prisma.buyerSession.findUnique({
      where: { id: sessionId },
      select: { id: true },
    });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Filter and sanitize events
    const validEvents = events
      .filter((e) => ALLOWED_TYPES.has(e.type))
      .map((e) => ({
        sessionId,
        type: e.type,
        metadata: JSON.stringify(e.metadata ?? {}),
      }));

    if (validEvents.length === 0) {
      return NextResponse.json({ inserted: 0 });
    }

    await prisma.buyerEvent.createMany({ data: validEvents });

    return NextResponse.json({ inserted: validEvents.length });
  } catch (err) {
    console.error("[buyer/events POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
