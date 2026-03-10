/**
 * GET /api/buyer/analytics/[pageId]?range=7d|30d|all
 *
 * Returns buyer analytics for a page. Requires authenticated session and page ownership/team access.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getIntentLabel } from "@/lib/engagement-score";
import { getUserTeamId } from "@/lib/team-auth";
import { withErrorHandler } from "@/lib/api-error";

function getRangeDate(range: string): Date | null {
  const now = new Date();
  if (range === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (range === "30d") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return null; // "all"
}

export const GET = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pageId } = await params;
    const range = req.nextUrl.searchParams.get("range") ?? "30d";
    const sinceDate = getRangeDate(range);

    // Pagination
    const pageParam = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10) || 50));

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
    const [visitors, totalVisitorCount, globalReturning, globalHighIntent, globalScoreAgg] = await Promise.all([
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
      // Global: high intent visitors
      prisma.buyerVisitor.count({
        where: {
          ...visitorWhere,
          OR: [{ ctaClicked: true }, { engagementScore: { gte: 70 } }],
        },
      }),
      // Global: average engagement score
      prisma.buyerVisitor.aggregate({
        where: visitorWhere,
        _avg: { engagementScore: true },
      }),
    ]);

    // Build response rows
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

      const intent = getIntentLabel(v.engagementScore, v.ctaClicked, pricingTabViewed);

      return {
        visitorId: v.id,
        visitorHash: v.visitorHash.slice(0, 8), // truncated for display
        sessions: v.totalSessions,
        firstSeenAt: v.firstSeenAt.toISOString(),
        lastSeenAt: v.lastSeenAt.toISOString(),
        totalDurationSeconds: totalDuration,
        engagementScore: v.engagementScore,
        mostViewedTab,
        ctaClicked: v.ctaClicked,
        pricingTabViewed,
        intent,
        contactName: v.contact?.name ?? null,
        contactEmail: v.contact?.email ?? null,
      };
    });

    return NextResponse.json({
      summary: {
        totalVisitors: totalVisitorCount,
        uniqueReturning: globalReturning,
        highIntentCount: globalHighIntent,
        avgScore: Math.round(globalScoreAgg._avg.engagementScore ?? 0),
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
