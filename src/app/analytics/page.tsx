import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserTeamId } from "@/lib/team-auth";
import { AppNav } from "@/components/app-nav";
import { AnalyticsTable } from "@/components/analytics-table";
import { AnalyticsStatCards } from "@/components/analytics-stat-cards";
import { ViewsChart } from "@/components/views-chart";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { formatDuration } from "@/lib/format-utils";

const PAGE_SIZE = 50;

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const teamId = await getUserTeamId(session.user.id);

  const pageWhere = teamId
    ? {
        OR: [
          { teamId, visibility: "TEAM" as const },
          { userId: session.user.id, visibility: "PRIVATE" as const },
        ],
      }
    : { userId: session.user.id };

  // Fetch total count + paginated pages in parallel
  const [totalPages, pages] = await Promise.all([
    prisma.page.count({ where: pageWhere }),
    prisma.page.findMany({
      where: pageWhere,
      orderBy: { updatedAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const pageIds = pages.map((p) => p.id);
  const totalPageCount = Math.ceil(totalPages / PAGE_SIZE);

  // ── Global stats + daily views ── all in one parallel batch ──────────────
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    allViewStats,
    allEventStats,
    submissionCount,
    dailyViews,
    buyerAggregate,
    highIntentCount,
    // Per-page batched stats (3 queries instead of 4*N)
    viewsByPage,
    eventsByPage,
    buyersByPage,
    highIntentByPage,
  ] = await Promise.all([
    // Global aggregates
    prisma.pageView.aggregate({
      where: { pageId: { in: pageIds } },
      _count: { id: true },
      _avg: { duration: true },
    }),
    prisma.pageEvent.groupBy({
      by: ["type"],
      where: { pageId: { in: pageIds } },
      _count: { id: true },
    }),
    prisma.formSubmission.count({ where: { pageId: { in: pageIds } } }),
    // Fix #2: Use raw SQL DATE_TRUNC instead of groupBy on exact timestamp
    prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT DATE_TRUNC('day', "createdAt") AS day, COUNT(*)::bigint AS count
      FROM "PageView"
      WHERE "pageId" = ANY(${pageIds})
        AND "createdAt" >= ${sevenDaysAgo}
      GROUP BY day
      ORDER BY day ASC
    `,
    prisma.buyerVisitor.aggregate({
      where: { pageId: { in: pageIds } },
      _count: { id: true },
    }),
    // Fix: was sequential, now parallel
    prisma.buyerVisitor.count({
      where: {
        pageId: { in: pageIds },
        OR: [{ ctaClicked: true }, { engagementScore: { gte: 70 } }],
      },
    }),

    // Fix #1: Batched per-page stats (4 queries total instead of 4*N)
    prisma.pageView.groupBy({
      by: ["pageId"],
      where: { pageId: { in: pageIds } },
      _count: { id: true },
      _avg: { duration: true },
    }),
    prisma.pageEvent.groupBy({
      by: ["pageId", "type"],
      where: { pageId: { in: pageIds } },
      _count: { id: true },
    }),
    prisma.buyerVisitor.groupBy({
      by: ["pageId"],
      where: { pageId: { in: pageIds } },
      _count: { id: true },
    }),
    prisma.buyerVisitor.groupBy({
      by: ["pageId"],
      where: {
        pageId: { in: pageIds },
        OR: [{ ctaClicked: true }, { engagementScore: { gte: 70 } }],
      },
      _count: { id: true },
    }),
  ]);

  // ── Build lookup maps from batched results ──────────────────────────────
  const viewsMap = new Map(viewsByPage.map((v) => [v.pageId, v]));
  const buyersMap = new Map(buyersByPage.map((b) => [b.pageId, b._count.id]));
  const highIntentMap = new Map(highIntentByPage.map((h) => [h.pageId, h._count.id]));

  // Link clicks by pageId
  const linkClicksMap = new Map<string, number>();
  for (const e of eventsByPage) {
    if (e.type === "link_click") {
      linkClicksMap.set(e.pageId, e._count.id);
    }
  }

  const perPageStats = pages.map((page) => {
    const vs = viewsMap.get(page.id);
    return {
      id: page.id,
      title: page.title,
      slug: page.slug,
      published: page.published,
      updatedAt: page.updatedAt.toISOString(),
      views: vs?._count.id ?? 0,
      avgDuration: Math.round(vs?._avg.duration ?? 0),
      linkClicks: linkClicksMap.get(page.id) ?? 0,
      uniqueBuyers: buyersMap.get(page.id) ?? 0,
      highIntentCount: highIntentMap.get(page.id) ?? 0,
    };
  });

  // ── Global stat cards ───────────────────────────────────────────────────
  const totalViews = allViewStats._count.id;
  const avgDuration = Math.round(allViewStats._avg.duration ?? 0);
  const totalLinkClicks =
    allEventStats.find((e) => e.type === "link_click")?._count.id ?? 0;
  const totalBuyers = buyerAggregate._count.id;

  const sorted = [...perPageStats].sort((a, b) => b.views - a.views);
  const maxViews = sorted[0]?.views ?? 1;

  // ── Daily views chart (from raw SQL results) ────────────────────────────
  const dailyMap = new Map<string, number>();
  for (const row of dailyViews) {
    const key = new Date(row.day).toISOString().slice(0, 10); // "YYYY-MM-DD"
    dailyMap.set(key, Number(row.count));
  }

  const days: { label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    days.push({ label, count: dailyMap.get(key) ?? 0 });
  }


  // Restrained, brand-forward accents:
  //  - Hero metric (Total Views) → primary forest green.
  //  - Buyer-intelligence money-metrics (Unique Buyers, High Intent) → distinct
  //    chart-token accents so they stand out from the neutral supporting metrics.
  //  - Supporting metrics stay muted/neutral so the eye lands on what matters.
  const HERO_ACCENT = "hsl(var(--primary))";
  const BUYER_ACCENT = "hsl(var(--chart-2))";      // teal
  const INTENT_ACCENT = "hsl(var(--chart-5))";     // warm orange
  const MUTED_ACCENT = "hsl(var(--muted-foreground))";

  const statCards = [
    { label: "Total Views",       value: totalViews.toLocaleString(),      icon: "Eye",      accent: HERO_ACCENT,   description: "Total page views across all published pages" },
    { label: "Avg. Time on Page", value: formatDuration(avgDuration),      icon: "Clock",    accent: MUTED_ACCENT,  description: "Average time visitors spend viewing your pages" },
    { label: "Link Clicks",       value: totalLinkClicks.toLocaleString(), icon: "Link2",    accent: MUTED_ACCENT,  description: "Number of times visitors clicked links in your pages" },
    { label: "Form Submissions",  value: submissionCount.toLocaleString(), icon: "FileText", accent: MUTED_ACCENT,  description: "Total form responses submitted by visitors" },
    { label: "Unique Visitors",   value: totalBuyers.toLocaleString(),     icon: "Users",    accent: BUYER_ACCENT,  description: "Distinct visitors (per device) across all pages" },
    { label: "High Intent",       value: highIntentCount.toLocaleString(), icon: "Target",   accent: INTENT_ACCENT, description: "Buyers who clicked a CTA or have a high engagement score" },
  ];

  return (
    <main className="min-h-screen bg-background">
      <AppNav />
      <PageContainer size="md">
        <PageHeader
          title="Analytics"
          description="Performance overview — click any page row to see buyer-level insights"
          className="mb-6"
        />

        <AnalyticsStatCards cards={statCards} />

        <ViewsChart days={days} />

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-foreground">Pages</h3>
            <p className="text-xs text-muted-foreground">Click a row to expand buyer analytics</p>
          </div>
          <AnalyticsTable pages={sorted} maxViews={maxViews} />

          {/* Pagination */}
          {totalPageCount > 1 && (
            <div className="px-6 py-4 border-t border-border flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPageCount} ({totalPages} pages)
              </p>
              <div className="flex items-center gap-2">
                {currentPage > 1 && (
                  <Button asChild variant="outline" size="sm">
                    <a href={`/analytics?page=${currentPage - 1}`}>Previous</a>
                  </Button>
                )}
                {currentPage < totalPageCount && (
                  <Button asChild variant="outline" size="sm">
                    <a href={`/analytics?page=${currentPage + 1}`}>Next</a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </PageContainer>
    </main>
  );
}
