import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserTeamId } from "@/lib/team-auth";
import { AppNav } from "@/components/app-nav";
import { AnalyticsTable } from "@/components/analytics-table";
import { Eye, Clock, Link2, FileText, TrendingUp, Users, Target } from "lucide-react";

function formatDuration(s: number) {
  if (!s) return "—";
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const teamId = await getUserTeamId(session.user.id);

  const pages = await prisma.page.findMany({
    where: teamId
      ? {
          OR: [
            { teamId, visibility: "TEAM" },
            { userId: session.user.id, visibility: "PRIVATE" },
          ],
        }
      : { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  const pageIds = pages.map((p) => p.id);

  const [allViewStats, allEventStats, submissionCount, recentViews, buyerAggregate] =
    await Promise.all([
      prisma.pageView.aggregate({
        where: { pageId: { in: pageIds } },
        _count: { id: true },
        _avg:   { duration: true },
      }),
      prisma.pageEvent.groupBy({
        by:    ["type"],
        where: { pageId: { in: pageIds } },
        _count: { id: true },
      }),
      prisma.formSubmission.count({ where: { pageId: { in: pageIds } } }),
      prisma.pageView.groupBy({
        by:    ["createdAt"],
        where: {
          pageId:    { in: pageIds },
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        _count:  { id: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.buyerVisitor.aggregate({
        where:  { pageId: { in: pageIds } },
        _count: { id: true },
      }),
    ]);

  const totalViews      = allViewStats._count.id;
  const avgDuration     = Math.round(allViewStats._avg.duration ?? 0);
  const totalLinkClicks = allEventStats.find((e) => e.type === "link_click")?._count.id ?? 0;
  const totalBuyers     = buyerAggregate._count.id;

  const highIntentCount = await prisma.buyerVisitor.count({
    where: {
      pageId: { in: pageIds },
      OR:     [{ ctaClicked: true }, { engagementScore: { gte: 70 } }],
    },
  });

  const perPageStats = await Promise.all(
    pages.map(async (page) => {
      const [vs, es, buyerCount, highIntent] = await Promise.all([
        prisma.pageView.aggregate({
          where:  { pageId: page.id },
          _count: { id: true },
          _avg:   { duration: true },
        }),
        prisma.pageEvent.groupBy({
          by:    ["type"],
          where: { pageId: page.id },
          _count: { id: true },
        }),
        prisma.buyerVisitor.count({ where: { pageId: page.id } }),
        prisma.buyerVisitor.count({
          where: {
            pageId: page.id,
            OR: [{ ctaClicked: true }, { engagementScore: { gte: 70 } }],
          },
        }),
      ]);
      return {
        id:              page.id,
        title:           page.title,
        slug:            page.slug,
        published:       page.published,
        updatedAt:       page.updatedAt,
        views:           vs._count.id,
        avgDuration:     Math.round(vs._avg.duration ?? 0),
        linkClicks:      es.find((e) => e.type === "link_click")?._count.id ?? 0,
        uniqueBuyers:    buyerCount,
        highIntentCount: highIntent,
      };
    })
  );

  const sorted   = [...perPageStats].sort((a, b) => b.views - a.views);
  const maxViews = sorted[0]?.views ?? 1;

  const days: { label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    const count = recentViews
      .filter((v) => {
        const vd = new Date(v.createdAt);
        return (
          vd.getFullYear() === d.getFullYear() &&
          vd.getMonth()    === d.getMonth()    &&
          vd.getDate()     === d.getDate()
        );
      })
      .reduce((sum, v) => sum + v._count.id, 0);
    days.push({ label, count });
  }
  const maxDay = Math.max(...days.map((d) => d.count), 1);

  const statCards = [
    { label: "Total Views",       value: totalViews.toLocaleString(),      icon: Eye,    color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "Avg. Time on Page", value: formatDuration(avgDuration),      icon: Clock,  color: "text-violet-500",  bg: "bg-violet-50 dark:bg-violet-950/30" },
    { label: "Link Clicks",       value: totalLinkClicks.toLocaleString(), icon: Link2,  color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Form Submissions",  value: submissionCount.toLocaleString(), icon: FileText, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30" },
    { label: "Unique Buyers",     value: totalBuyers.toLocaleString(),     icon: Users,  color: "text-sky-500",     bg: "bg-sky-50 dark:bg-sky-950/30" },
    { label: "High Intent",       value: highIntentCount.toLocaleString(), icon: Target, color: "text-pink-500",    bg: "bg-pink-50 dark:bg-pink-950/30" },
  ];

  return (
    <main className="min-h-screen bg-background">
      <AppNav />
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Analytics</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Performance overview — click any page row to see buyer-level insights
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={color} style={{ width: "1rem", height: "1rem" }} />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground tracking-tight">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Views — last 7 days</h3>
          </div>
          <div className="flex items-end gap-2 h-24">
            {days.map(({ label, count }) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className="w-full rounded-t-sm bg-primary/80 transition-all"
                  style={{
                    height:    `${Math.max(4, (count / maxDay) * 80)}px`,
                    minHeight: count > 0 ? "8px" : "3px",
                    opacity:   count === 0 ? 0.25 : 1,
                  }}
                />
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-foreground">Pages</h3>
            <p className="text-xs text-muted-foreground">Click a row to expand buyer analytics ↓</p>
          </div>
          <AnalyticsTable pages={sorted} maxViews={maxViews} />
        </div>
      </div>
    </main>
  );
}
