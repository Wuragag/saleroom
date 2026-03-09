/**
 * POST /api/buyer/session
 *
 * Start or resume a buyer session.
 * Body: { visitorId: string; pageId: string }
 *   visitorId — UUID generated client-side, stored in localStorage
 *   pageId    — public page ID
 *
 * Returns: { sessionId, visitorDbId, isReturn }
 */

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// 30-minute inactivity window (ms)
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

// Rate limit: 20 session creations per minute per IP
const limiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 });

function hashVisitorId(raw: string, pageId: string): string {
  return createHash("sha256").update(`${raw}:${pageId}`).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit check
    const ip = getClientIp(req);
    const { success } = limiter.check(ip, 20);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const { visitorId, pageId, refToken } = body as {
      visitorId?: string;
      pageId?: string;
      refToken?: string;
    };

    if (!visitorId || !pageId) {
      return NextResponse.json({ error: "Missing visitorId or pageId" }, { status: 400 });
    }

    // Verify the page exists (and isn't soft-deleted, etc.)
    const page = await prisma.page.findUnique({ where: { id: pageId }, select: { id: true } });
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Resolve refToken to a contactId (if valid)
    let contactId: string | null = null;
    if (refToken) {
      const contact = await prisma.pageContact.findUnique({
        where: { refToken },
        select: { id: true, pageId: true },
      });
      if (contact?.pageId === pageId) {
        contactId = contact.id;
      }
    }

    const visitorHash = hashVisitorId(visitorId, pageId);
    const now = new Date();

    // Atomic: upsert visitor, decide new vs resumed session
    const result = await prisma.$transaction(async (tx) => {
      // Upsert visitor
      const visitor = await tx.buyerVisitor.upsert({
        where: { visitorHash_pageId: { visitorHash, pageId } },
        update: { lastSeenAt: now },
        create: {
          visitorHash,
          pageId,
          contactId,
          firstSeenAt: now,
          lastSeenAt: now,
          totalSessions: 0,
          engagementScore: 0,
          ctaClicked: false,
        },
      });

      // If visitor exists but has no contact, link them now
      if (contactId && !visitor.contactId) {
        await tx.buyerVisitor.update({
          where: { id: visitor.id },
          data: { contactId },
        });
      }

      // Check for a recent session (within timeout window)
      const recentSession = await tx.buyerSession.findFirst({
        where: {
          visitorId: visitor.id,
          lastActiveAt: { gte: new Date(now.getTime() - SESSION_TIMEOUT_MS) },
        },
        orderBy: { lastActiveAt: "desc" },
      });

      if (recentSession) {
        // Resume
        await tx.buyerSession.update({
          where: { id: recentSession.id },
          data: { lastActiveAt: now },
        });
        return { session: recentSession, visitor, isNew: false };
      }

      // New session
      const isReturn = visitor.totalSessions > 0;
      const session = await tx.buyerSession.create({
        data: {
          visitorId: visitor.id,
          pageId,
          startedAt: now,
          lastActiveAt: now,
          duration: 0,
          engagementScore: 0,
          isReturn,
        },
      });

      await tx.buyerVisitor.update({
        where: { id: visitor.id },
        data: { totalSessions: { increment: 1 } },
      });

      return { session, visitor, isNew: true };
    });

    return NextResponse.json({
      sessionId: result.session.id,
      visitorDbId: result.visitor.id,
      isReturn: result.session.isReturn,
      isNew: result.isNew,
    });
  } catch (err) {
    console.error("[buyer/session POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
