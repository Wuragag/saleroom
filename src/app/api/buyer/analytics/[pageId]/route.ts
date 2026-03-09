/**
 * GET /api/buyer/analytics/[pageId]?range=7d|30d|all
 *
 * Returns buyer analytics for a page. Requires authenticated session and page ownership/team access.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getIntentLabel } from "@/lib/engagement-score";

function getRangeDate(range: string): Date | null {
  const now = new Date();
  if (range === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (range === "30d") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return null; // "all"
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pageId } = await params;
    const range = req.nextUrl.searchParams.get("range") ?? "30d";
    const sinceDate = getRangeDate(range);

    // Verify access: page must belong to the user's team or user directly
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { userId: true, teamId: true },
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const teamId = (session.user as { teamId?: string }).teamId;
    const hasAccess =
      page.userId === session.user.id ||
      (teamId && page.teamId === teamId);

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch visitors with their sessions, tab views, and linked contacts
    const visitors = await prisma.buyerVisitor.findMany({
      where: {
        pageId,
        ...(sinceDate ? { lastSeenAt: { gte: sinceDate } } : {}),
      },
      include: {
        contact: { select: { name: true, email: true } },
        sessions: {
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
    });

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

    // Summary stats
    const totalVisitors = rows.length;
    const uniqueReturning = rows.filter((r) => r.sessions > 1).length;
    const highIntentCount = rows.filter((r) => r.intent === "High Intent").length;
    const avgScore =
      rows.length > 0
        ? Math.round(rows.reduce((s, r) => s + r.engagementScore, 0) / rows.length)
        : 0;

    return NextResponse.json({
      summary: { totalVisitors, uniqueReturning, highIntentCount, avgScore },
      visitors: rows,
    });
  } catch (err) {
    console.error("[buyer/analytics GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
