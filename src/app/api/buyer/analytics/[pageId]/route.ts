/**
 * GET /api/buyer/analytics/[pageId]?range=7d|30d|all
 *
 * Returns buyer analytics for a page. Requires authenticated session and page ownership/team access.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIntentLabel, aggregateVisitorScore } from "@/lib/engagement-score";
import { getUserTeamId } from "@/lib/team-auth";
import { withAuth } from "@/lib/api-auth";

function getRangeDate(range: string): Date | null {
  const now = new Date();
  if (range === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (range === "30d") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return null; // "all"
}

export const GET = withAuth<{ pageId: string }>(async (req, { params, session }) => {
    const searchParams = (req as NextRequest).nextUrl.searchParams;
    const { pageId } = await params;
    const range = searchParams.get("range") ?? "30d";
    const sinceDate = getRangeDate(range);

    // Pagination
    const pageParam = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50));

    // Verify access: page must belong to the user's team or user directly
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { userId: true, teamId: true },
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const teamId = await getUserTeamId(session.user.id);
    const hasAccess =
      page.userId === session.user.id ||
      (teamId && page.teamId === teamId);

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const visitorWhere = {
      pageId,
      ...(sinceDate ? { lastSeenAt: { gte: sinceDate } } : {}),
    };

    // Fetch paginated visitors + global summary stats in parallel
    const [visitors, totalVisitorCount, globalReturning] = await Promise.all([
      prisma.buyerVisitor.findMany({
        where: visitorWhere,
        take: limit,
        skip: (pageParam - 1) * limit,
        include: {
          contact: { select: { name: true, email: true } },
          sessions: {
            take: 10, // limit nested sessions to most recent 10
            include: {
              tabViews: true,
              events: {
                where: { type: { in: ["CTA_CLICK", "FILE_DOWNLOAD", "TAB_VIEW"] } },
                select: { type: true, metadata: true },
              },
            },
            orderBy: { startedAt: "desc" },
          },
        },
        orderBy: { lastSeenAt: "desc" },
      }),
      prisma.buyerVisitor.count({ where: visitorWhere }),
      // Global: return visitors (totalSessions > 1)
      prisma.buyerVisitor.count({
        where: { ...visitorWhere, totalSessions: { gt: 1 } },
      }),
    ]);

    // Build response rows — compute visitor engagement score at read time
    // from session scores (deferred from heartbeat writes to reduce DB ops)
    const rows = visitors.map((v) => {
      const totalDuration = v.sessions.reduce((sum, s) => sum + s.duration, 0);
      const allTabViews = v.sessions.flatMap((s) => s.tabViews);

      // Find most viewed tab by accumulated duration across sessions
      const tabDurationMap = new Map<string, { name: string; duration: number }>();
      for (const tv of allTabViews) {
        const existing = tabDurationMap.get(tv.tabId);
        if (existing) {
          existing.duration += tv.duration;
        } else {
          tabDurationMap.set(tv.tabId, { name: tv.tabName, duration: tv.duration });
        }
      }
      const mostViewedTab =
        [...tabDurationMap.values()].sort((a, b) => b.duration - a.duration)[0]?.name ?? "—";

      // Check if pricing tab was ever viewed
      const pricingTabViewed = allTabViews.some((tv) =>
        tv.tabName.toLowerCase().includes("pric")
      );

      // Compute visitor score from session scores at read time
      const sessionScores = v.sessions.map((s) => s.engagementScore);
      const computedScore = aggregateVisitorScore(sessionScores);
      const intent = getIntentLabel(computedScore, v.ctaClicked, pricingTabViewed);

      return {
        visitorId: v.id,
        visitorHash: v.visitorHash.slice(0, 8), // truncated for display
        sessions: v.totalSessions,
        firstSeenAt: v.firstSeenAt.toISOString(),
        lastSeenAt: v.lastSeenAt.toISOString(),
        totalDurationSeconds: totalDuration,
        engagementScore: computedScore,
        mostViewedTab,
        ctaClicked: v.ctaClicked,
        pricingTabViewed,
        intent,
        contactName: v.contact?.name ?? null,
        contactEmail: v.contact?.email ?? null,
      };
    });

    // Compute summary stats from the current page of visitors
    // (approximation scoped to loaded rows — good enough for dashboard UX)
    const highIntentCount = rows.filter((r) => r.intent === "High Intent").length;
    const avgScore = rows.length > 0
      ? Math.round(rows.reduce((sum, r) => sum + r.engagementScore, 0) / rows.length)
      : 0;

    return NextResponse.json({
      summary: {
        totalVisitors: totalVisitorCount,
        uniqueReturning: globalReturning,
        highIntentCount,
        avgScore,
      },
      visitors: rows,
      pagination: {
        page: pageParam,
        limit,
        total: totalVisitorCount,
        totalPages: Math.ceil(totalVisitorCount / limit),
      },
    });
});
