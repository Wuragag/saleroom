/**
 * POST /api/buyer/session
 *
 * Start or resume a buyer session.
 * Body: { visitorId: string; pageId: string; refToken?; refSource?; refProof?; viaToken? }
 *   visitorId — UUID generated client-side, stored in localStorage
 *   pageId    — public page ID
 *   refToken  — identity: contact this browser is known to be (identity cookie)
 *   refSource — how that identity was issued: "link" | "gate" | "verified"
 *   refProof  — server signature over (page, token, source) issued by the
 *               published page; identity is ignored without a valid one, so a
 *               client can't assert a token it merely knows (a forwarded link)
 *   viaToken  — referrer: whose personal link this browser arrived through
 *
 * Identity is set once and never overwritten; the referrer is recorded even
 * when identity is unknown so a forwarded link shows up as
 * "unidentified · via <contact>" (see src/lib/page-gate.ts).
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
import { resolveIdentitySource, isForwardedVisitor, type RefCookieSource } from "@/lib/page-gate";
import { verifyIdentityAssertion } from "@/lib/gate-token";
import type { IdentitySource } from "@/generated/prisma";

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
    const { visitorId, pageId, refToken, refSource, refProof, viaToken } = body as {
      visitorId?: string;
      pageId?: string;
      refToken?: string;
      refSource?: string;
      refProof?: string;
      viaToken?: string;
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

    // Resolve identity (refToken) and referrer (viaToken) to contacts on
    // this page. Tokens for another page are ignored, not errors.
    let contactId: string | null = null;
    let identitySource: IdentitySource | null = null;
    let referredByContactId: string | null = null;

    // Identity counts only with the page's signature over it.
    const source: RefCookieSource =
      refSource === "gate" || refSource === "verified" ? refSource : "link";
    const attestedToken =
      refToken && verifyIdentityAssertion(pageId, refToken, source, refProof) ? refToken : null;

    const tokens = [attestedToken, viaToken].filter((t): t is string => typeof t === "string" && !!t);
    if (tokens.length > 0) {
      const found = await prisma.pageContact.findMany({
        where: { refToken: { in: tokens }, pageId },
        select: { id: true, refToken: true, verifiedAt: true },
      });
      const identity = found.find((c) => c.refToken === attestedToken);
      if (identity) {
        contactId = identity.id;
        identitySource = resolveIdentitySource(source, !!identity.verifiedAt);
      }
      const referrer = found.find((c) => c.refToken === viaToken);
      if (referrer) {
        referredByContactId = referrer.id;
      } else if (identity && !viaToken && source === "link") {
        // Legacy cookie (issued before the referrer cookie existed): a bare
        // link claim did come through that link. Gate-typed identities with
        // no referrer stay unreferred — no link was involved.
        referredByContactId = identity.id;
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
          identitySource,
          referredByContactId,
          firstSeenAt: now,
          lastSeenAt: now,
          totalSessions: 0,
          engagementScore: 0,
          ctaClicked: false,
        },
      });

      // Fill in what a returning browser has since told us. Identity is
      // write-once (an established claim is never re-pointed); the referrer
      // is recorded the first time we learn it.
      const patch: { contactId?: string; identitySource?: IdentitySource; referredByContactId?: string } = {};
      if (contactId && !visitor.contactId) {
        patch.contactId = contactId;
        if (identitySource) patch.identitySource = identitySource;
      }
      if (referredByContactId && !visitor.referredByContactId) {
        patch.referredByContactId = referredByContactId;
      }
      if (Object.keys(patch).length > 0) {
        await tx.buyerVisitor.update({ where: { id: visitor.id }, data: patch });
      }
      const effective = {
        contactId: visitor.contactId ?? patch.contactId ?? null,
        referredByContactId: visitor.referredByContactId ?? patch.referredByContactId ?? null,
      };

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
        return { session: recentSession, visitor, effective, isNew: false, tabViews, recordingChunkCount };
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

      return { session, visitor, effective, isNew: true };
    });

    // Notify the page owner of a genuinely new session (opt-in, throttled,
    // sent after the response so visitor latency is unaffected)
    if (result.isNew && page.notifyOnView && page.user.email) {
      const ownerEmail = page.user.email;
      const isReturn = result.session.isReturn;
      const forwarded = isForwardedVisitor(result.effective);
      const forwardedFromId = forwarded ? result.effective.referredByContactId : null;
      // Derive origin from the incoming request rather than a possibly
      // unset/misconfigured NEXTAUTH_URL (that fallback previously meant
      // notification emails could link to http://localhost:3000).
      const appUrl = req.nextUrl.origin;
      after(async () => {
        try {
          const { success } = await notifyLimiter.limit(pageId);
          if (!success) return;
          let viaLabel: string | undefined;
          if (forwardedFromId) {
            const ref = await prisma.pageContact.findUnique({
              where: { id: forwardedFromId },
              select: { name: true, email: true },
            });
            viaLabel = ref?.name || ref?.email || undefined;
          }
          await sendViewNotificationEmail(
            ownerEmail,
            page.title,
            `${appUrl}/analytics`,
            isReturn,
            viaLabel
          );
        } catch (err) {
          console.error("[buyer/session notify]", err);
        }
      });
    }

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
