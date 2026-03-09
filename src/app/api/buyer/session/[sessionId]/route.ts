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
import { computeSessionScore, aggregateVisitorScore } from "@/lib/engagement-score";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// Rate limit: 60 heartbeats per minute per IP (client sends every ~30s)
const limiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 });

interface TabViewInput {
  tabId: string;
  tabName: string;
  duration: number;
  viewCount: number;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    // Rate limit check
    const ip = getClientIp(req);
    const { success } = limiter.check(ip, 60);
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

    await prisma.$transaction(async (tx) => {
      // Update session
      await tx.buyerSession.update({
        where: { id: sessionId },
        data: {
          duration,
          lastActiveAt: now,
          engagementScore: sessionScore,
        },
      });

      // Upsert tab views
      for (const tv of tabViews) {
        await tx.buyerTabView.upsert({
          where: { sessionId_tabId: { sessionId, tabId: tv.tabId } },
          update: {
            duration: tv.duration,
            viewCount: tv.viewCount,
            lastViewedAt: now,
            tabName: tv.tabName,
          },
          create: {
            sessionId,
            tabId: tv.tabId,
            tabName: tv.tabName,
            duration: tv.duration,
            viewCount: tv.viewCount,
            lastViewedAt: now,
          },
        });
      }

      // Update visitor aggregates
      const allSessions = await tx.buyerSession.findMany({
        where: { visitorId: session.visitorId },
        select: { engagementScore: true },
      });
      const allScores = allSessions.map((s) => s.engagementScore);
      // Replace current session score in array (already updated above)
      const updatedScores = allScores; // already includes updated score (session was updated above)
      const visitorScore = aggregateVisitorScore(updatedScores);

      await tx.buyerVisitor.update({
        where: { id: session.visitorId },
        data: {
          lastSeenAt: now,
          engagementScore: visitorScore,
          ctaClicked: ctaClicked ? true : undefined,
        },
      });
    });

    return NextResponse.json({ ok: true, score: sessionScore });
  } catch (err) {
    console.error("[buyer/session PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
