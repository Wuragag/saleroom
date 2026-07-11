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
import { after } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { withErrorHandler } from "@/lib/api-error";
import { isBotUserAgent } from "@/lib/bot-detect";
import { sendViewNotificationEmail } from "@/lib/email";
import { trackEvent } from "@/lib/analytics-forwarder";

// 30-minute inactivity window (ms)
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

// Rate limit: 20 session creations per minute per IP
const limiter = rateLimit({ limit: 20, window: "60s" });

// Throttle view-notification emails: max 5 per hour per page
const notifyLimiter = rateLimit({ limit: 5, window: "1h", prefix: "notify" });

function hashVisitorId(raw: string, pageId: string): string {
  return createHash("sha256").update(`${raw}:${pageId}`).digest("hex");
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  try {
    // Keep crawlers/preview fetchers out of analytics (200 so clients stay silent)
    if (isBotUserAgent(req.headers.get("user-agent"))) {
      return NextResponse.json({ skipped: true });
    }

    // Rate limit check
    const ip = getClientIp(req);
    const { success } = await limiter.limit(ip);
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

    // Only published pages accumulate analytics
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: {
        published: true,
        notifyOnView: true,
        title: true,
        user: { select: { email: true } },
      },
    });
    if (!page?.published) {
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
        // Resume — return accumulated state so the client can keep sending
        // absolute totals instead of restarting from zero
        await tx.buyerSession.update({
          where: { id: recentSession.id },
          data: { lastActiveAt: now },
        });
        const tabViews = await tx.buyerTabView.findMany({
          where: { sessionId: recentSession.id },
          select: { tabId: true, tabName: true, duration: true, viewCount: true },
        });
        // Resume after the highest stored chunk index, not the row count.
        // A dropped non-retriable chunk can leave gaps; using count would then
        // overwrite a later chunk on the next visit.
        const recordingChunkMax = await tx.sessionRecording.aggregate({
          where: { sessionId: recentSession.id },
          _max: { chunkIndex: true },
        });
        const recordingChunkCount = (recordingChunkMax._max.chunkIndex ?? -1) + 1;
        return { session: recentSession, visitor, isNew: false, tabViews, recordingChunkCount };
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

    // Notify the page owner of a genuinely new session (opt-in, throttled,
    // sent after the response so visitor latency is unaffected)
    if (result.isNew && page.notifyOnView && page.user.email) {
      const ownerEmail = page.user.email;
      const isReturn = result.session.isReturn;
      // Derive origin from the incoming request rather than a possibly
      // unset/misconfigured NEXTAUTH_URL (that fallback previously meant
      // notification emails could link to http://localhost:3000).
      const appUrl = req.nextUrl.origin;
      after(async () => {
        try {
          const { success } = await notifyLimiter.limit(pageId);
          if (!success) return;
          await sendViewNotificationEmail(
            ownerEmail,
            page.title,
            `${appUrl}/analytics`,
            isReturn
          );
        } catch (err) {
          console.error("[buyer/session notify]", err);
        }
      });
    }

    // Mirror the (pseudonymous) buyer session to product analytics, keyed by
    // the visitor hash so returning buyers stitch into one profile. Runs off
    // the response path; no-op unless a provider is configured.
    after(() =>
      trackEvent({
        distinctId: visitorHash,
        event: result.isNew ? "buyer_session_started" : "buyer_session_resumed",
        properties: {
          pageId,
          contactId,
          isReturn: result.session.isReturn,
        },
      })
    );

    return NextResponse.json({
      sessionId: result.session.id,
      visitorDbId: result.visitor.id,
      isReturn: result.session.isReturn,
      isNew: result.isNew,
      ...(result.isNew
        ? {}
        : {
            resumed: true,
            duration: result.session.duration,
            tabViews: result.tabViews ?? [],
            recordingChunkCount: result.recordingChunkCount ?? 0,
          }),
    });
  } catch (err: unknown) {
    // FK violation on pageId means the page doesn't exist
    const message = err instanceof Error ? err.message : "";
    if (message.includes("Foreign key constraint") || message.includes("violates foreign key")) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }
    console.error("[buyer/session POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
