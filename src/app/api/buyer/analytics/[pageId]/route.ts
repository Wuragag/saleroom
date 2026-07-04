/**
 * GET /api/buyer/analytics/[pageId]?range=7d|30d|all
 *
 * Returns buyer analytics for a page. Requires authenticated session and page ownership/team access.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getIntentLabel } from "@/lib/engagement-score";
import { aggregateSections, type SectionScrollInput } from "@/lib/section-engagement";
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

    // Verify access: page must belong to the user's team or user directly.
    // PRIVATE pages are creator-only — a teammate must NOT see them even when
    // the page still carries the team's id (matches checkPageAccess semantics).
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { userId: true, teamId: true, visibility: true },
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const teamId = await getUserTeamId(session.user.id);
    const hasAccess =
      page.userId === session.user.id ||
      (page.visibility !== "PRIVATE" && !!teamId && page.teamId === teamId);

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const visitorWhere = {
      pageId,
      ...(sinceDate ? { lastSeenAt: { gte: sinceDate } } : {}),
    };

    // High Intent = clicked a CTA, viewed pricing, or scored >= 70. Same
    // definition getIntentLabel() applies per-row and the dashboard uses, now
    // all reading the same stored BuyerVisitor columns.
    const highIntentWhere = {
      ...visitorWhere,
      OR: [{ ctaClicked: true }, { pricingTabViewed: true }, { engagementScore: { gte: 70 } }],
    };

    // Fetch paginated visitors + GLOBAL summary stats in parallel. Summary
    // tiles (High Intent, Avg Score) are computed across every visitor, not
    // just the current page of rows, so they line up with the global total.
    const [visitors, totalVisitorCount, globalReturning, globalHighIntent, scoreAgg] = await Promise.all([
      prisma.buyerVisitor.findMany({
        where: visitorWhere,
        take: limit,
        skip: (pageParam - 1) * limit,
        include: {
          contact: { select: { name: true, email: true } },
          sessions: {
            take: 10, // nested sessions capped for the drill-down detail (see below)
            include: {
              tabViews: true,
              events: {
                where: {
                  type: {
                    in: [
                      "CTA_CLICK",
                      "FILE_DOWNLOAD",
                      "TAB_VIEW",
                      "SCROLL_25",
                      "SCROLL_50",
                      "SCROLL_75",
                      "SCROLL_100",
                    ],
                  },
                },
                select: { type: true, metadata: true },
              },
              _count: { select: { recordings: true } },
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
      // Global: High Intent visitors
      prisma.buyerVisitor.count({ where: highIntentWhere }),
      // Global: average engagement score
      prisma.buyerVisitor.aggregate({ where: visitorWhere, _avg: { engagementScore: true } }),
    ]);

    // True total session duration per loaded visitor — summed across ALL their
    // sessions, not just the ≤10 most-recent ones loaded above. Without this the
    // headline "time on page" would truncate for heavy returning buyers while
    // their session count showed the full number.
    const visitorIds = visitors.map((v) => v.id);
    const durationByVisitor = visitorIds.length
      ? await prisma.buyerSession.groupBy({
          by: ["visitorId"],
          where: { visitorId: { in: visitorIds } },
          _sum: { duration: true },
        })
      : [];
    const durationMap = new Map(durationByVisitor.map((d) => [d.visitorId, d._sum.duration ?? 0]));

    // Build response rows. Headline numbers (score, intent, pricing, duration)
    // come from the stored visitor columns / global duration sum so they match
    // the dashboard exactly; the ≤10 loaded sessions only drive the drill-down
    // detail (most-viewed tab, per-section engagement, recent session list).
    const rows = visitors.map((v) => {
      const totalDuration = durationMap.get(v.id) ?? 0;
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

      // Per-section engagement: dwell + views + scroll depth per tab
      const sections = aggregateSections(
        v.sessions.map((s) => ({
          tabViews: s.tabViews.map((tv) => ({
            tabId: tv.tabId,
            tabName: tv.tabName,
            duration: tv.duration,
            viewCount: tv.viewCount,
          })),
          scrollEvents: s.events
            .filter((e) => e.type.startsWith("SCROLL_"))
            .map((e): SectionScrollInput => {
              try {
                const meta = JSON.parse(e.metadata) as { tabId?: string | null; depth?: number };
                return { tabId: meta.tabId ?? null, depth: Number(meta.depth) || 0 };
              } catch {
                return { tabId: null, depth: 0 };
              }
            }),
        }))
      );

      // Score/intent from the stored, heartbeat-maintained visitor columns —
      // the same values the main dashboard reads, so the two never disagree.
      const intent = getIntentLabel(v.engagementScore, v.ctaClicked, v.pricingTabViewed);

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
        pricingTabViewed: v.pricingTabViewed,
        intent,
        contactName: v.contact?.name ?? null,
        contactEmail: v.contact?.email ?? null,
        sections,
        sessionsList: v.sessions.map((s) => ({
          sessionId: s.id,
          startedAt: s.startedAt.toISOString(),
          durationSeconds: s.duration,
          hasRecording: s._count.recordings > 0,
        })),
      };
    });

    // Summary stats are global (computed across all visitors above), not just
    // the loaded page of rows, so they line up with the global total.
    const highIntentCount = globalHighIntent;
    const avgScore = Math.round(scoreAgg._avg.engagementScore ?? 0);

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
