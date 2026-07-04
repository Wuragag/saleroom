/**
 * PATCH /api/buyer/session/[sessionId]
 *
 * Heartbeat / end-of-session update.
 * Body: {
 *   duration: number;          // total seconds on page
 *   tabViews: Array<{ tabId: string; tabName: string; duration: number; viewCount: number }>;
 *   ctaClicked?: boolean;
 *   pricingTabViewed?: boolean;
 *   fileDownloaded?: boolean;
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeSessionScore } from "@/lib/engagement-score";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { withErrorHandler } from "@/lib/api-error";

// Rate limit: 60 heartbeats per minute per IP (client sends every ~60s)
const limiter = rateLimit({ limit: 60, window: "60s" });

interface TabViewInput {
  tabId: string;
  tabName: string;
  duration: number;
  viewCount: number;
}

export const PATCH = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) => {
  try {
    // Rate limit check
    const ip = getClientIp(req);
    const { success } = await limiter.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { sessionId } = await params;
    const body = await req.json();
    const {
      duration: rawDuration = 0,
      tabViews: rawTabViews = [] as TabViewInput[],
      ctaClicked = false,
      pricingTabViewed = false,
      fileDownloaded = false,
    } = body;

    // Clamp duration and limit tabViews to prevent abuse
    const duration = Math.max(0, Math.min(Number(rawDuration) || 0, 86400));
    const tabViews = Array.isArray(rawTabViews) ? rawTabViews.slice(0, 50) : [];

    // Fetch session + visitor
    const session = await prisma.buyerSession.findUnique({
      where: { id: sessionId },
      include: { visitor: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const uniqueTabsViewed = tabViews.length;

    const sessionScore = computeSessionScore({
      uniqueTabsViewed,
      pricingTabViewed,
      ctaClicked,
      fileDownloaded,
      isReturn: session.isReturn,
      durationSeconds: duration,
      totalSessions: session.visitor.totalSessions,
    });

    const now = new Date();

    // Monotone approximation of aggregateVisitorScore (max session score +
    // 5 per extra session, bonus capped at 15) — cheap enough to keep the
    // stored column fresh, which the dashboard's High Intent counts and the
    // contacts endpoint read directly.
    const sessionBonus = Math.min(
      Math.max(session.visitor.totalSessions - 1, 0) * 5,
      15
    );
    const visitorScore = Math.min(sessionScore + sessionBonus, 100);

    await prisma.$transaction(async (tx) => {
      // Update session — GREATEST so late/out-of-order heartbeats and resumed
      // sessions can only grow duration/score, never clobber them
      await tx.$executeRaw`
        UPDATE "BuyerSession"
        SET "duration" = GREATEST("duration", ${duration}),
            "engagementScore" = GREATEST("engagementScore", ${sessionScore}),
            "lastActiveAt" = ${now}
        WHERE "id" = ${sessionId}
      `;

      // Upsert tab views with the same monotonic semantics
      for (const tv of tabViews) {
        const tabDuration = Math.max(0, Math.min(Number(tv.duration) || 0, 86400));
        const tabViewCount = Math.max(1, Math.min(Number(tv.viewCount) || 1, 10000));
        await tx.$executeRaw`
          INSERT INTO "BuyerTabView" ("id", "sessionId", "tabId", "tabName", "duration", "viewCount", "lastViewedAt")
          VALUES (${crypto.randomUUID()}, ${sessionId}, ${tv.tabId}, ${tv.tabName}, ${tabDuration}, ${tabViewCount}, ${now})
          ON CONFLICT ("sessionId", "tabId") DO UPDATE
          SET "duration" = GREATEST("BuyerTabView"."duration", EXCLUDED."duration"),
              "viewCount" = GREATEST("BuyerTabView"."viewCount", EXCLUDED."viewCount"),
              "tabName" = EXCLUDED."tabName",
              "lastViewedAt" = EXCLUDED."lastViewedAt"
        `;
      }

      // Keep the visitor's stored engagement score fresh (monotonic max) —
      // it was previously never written after creation, which silently broke
      // every score-based High Intent count. ctaClicked and pricingTabViewed
      // accumulate (OR) so both the dashboard and the per-page panel can derive
      // the same intent label from these stored columns.
      await tx.$executeRaw`
        UPDATE "BuyerVisitor"
        SET "engagementScore" = GREATEST("engagementScore", ${visitorScore}),
            "lastSeenAt" = ${now},
            "ctaClicked" = "ctaClicked" OR ${ctaClicked === true},
            "pricingTabViewed" = "pricingTabViewed" OR ${pricingTabViewed === true}
        WHERE "id" = ${session.visitorId}
      `;
    });

    return NextResponse.json({ ok: true, score: sessionScore });
  } catch (err) {
    console.error("[buyer/session PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
