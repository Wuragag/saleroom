import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/app-nav";
import { Eye, Clock, Link2, FileText, TrendingUp, Globe, FileX } from "lucide-react";

function formatDuration(s: number) {
  if (!s) return "—";
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function timeAgo(dateStr: string | Date) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const pages = await prisma.page.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  const pageIds = pages.map((p) => p.id);

  // Aggregate all views + events in parallel
  const [allViewStats, allEventStats, submissionCount, recentViews] =
    await Promise.all([
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
      // Last 7 days daily view counts
      prisma.pageView.groupBy({
        by: ["createdAt"],
        where: {
          pageId: { in: pageIds },
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        _count: { id: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

  const totalViews = allViewStats._count.id;
  const avgDuration = Math.round(allViewStats._avg.duration ?? 0);
  const totalLinkClicks =
    allEventStats.find((e) => e.type === "link_click")?._count.id ?? 0;

  // Per-page stats
  const perPageStats = await Promise.all(
    pages.map(async (page) => {
      const [vs, es] = await Promise.all([
        prisma.pageView.aggregate({
          where: { pageId: page.id },
          _count: { id: true },
          _avg: { duration: true },
        }),
        prisma.pageEvent.groupBy({
          by: ["type"],
          where: { pageId: page.id },
          _count: { id: true },
        }),
      ]);
      return {
        id: page.id,
        title: page.title,
        slug: page.slug,
        published: page.published,
        updatedAt: page.updatedAt,
        views: vs._count.id,
        avgDuration: Math.round(vs._avg.duration ?? 0),
        linkClicks:
          es.find((e) => e.type === "link_click")?._count.id ?? 0,
        shares: es.find((e) => e.type === "share")?._count.id ?? 0,
      };
    })
  );

  const sorted = [...perPageStats].sort((a, b) => b.views - a.views);
  const maxViews = sorted[0]?.views ?? 1;

  // Build a simple 7-day daily bar from recentViews
  const days: { label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    const count = recentViews.filter((v) => {
      const vd = new Date(v.createdAt);
      return (
        vd.getFullYear() === d.getFullYear() &&
        vd.getMonth() === d.getMonth() &&
        vd.getDate() === d.getDate()
      );
    }).reduce((sum, v) => sum + v._count.id, 0);
    days.push({ label, count });
  }
  const maxDay = Math.max(...days.map((d) => d.count), 1);

  const statCards = [
    {
      label: "Total Views",
      value: totalViews.toLocaleString(),
      icon: Eye,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Avg. Time on Page",
      value: formatDuration(avgDuration),
      icon: Clock,
      color: "text-violet-500",
      bg: "bg-violet-50 dark:bg-violet-950/30",
    },
    {
      label: "Link Clicks",
      value: totalLinkClicks.toLocaleString(),
      icon: Link2,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      label: "Form Submissions",
      value: submissionCount.toLocaleString(),
      icon: FileText,
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-950/30",
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      <AppNav />
      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Heading */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Analytics
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Performance overview across all your pages
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3"
            >
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`h-4.5 w-4.5 ${color}`} style={{ width: "1.125rem", height: "1.125rem" }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 7-day sparkbar */}
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
                    height: `${Math.max(4, (count / maxDay) * 80)}px`,
                    minHeight: count > 0 ? "8px" : "3px",
                    opacity: count === 0 ? 0.25 : 1,
                  }}
                />
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Per-page table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Pages</h3>
          </div>
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <FileX className="h-8 w-8 opacity-40" />
              <p className="text-sm">No pages yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sorted.map((p) => (
                <div
                  key={p.id}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-muted/40 transition-colors"
                >
                  {/* Title + status */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      {p.published ? (
                        <Globe className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <FileX className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                      <a
                        href={p.published ? `/p/${p.slug}` : `/editor/${p.id}`}
                        target={p.published ? "_blank" : undefined}
                        className="text-sm font-medium text-foreground truncate hover:underline"
                      >
                        {p.title}
                      </a>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 pl-5">
                      Updated {timeAgo(p.updatedAt)}
                    </p>
                  </div>

                  {/* Bar */}
                  <div className="w-24 hidden sm:block">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/70 rounded-full"
                        style={{ width: `${(p.views / maxViews) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-5 text-xs text-muted-foreground shrink-0">
                    <span className="flex items-center gap-1 w-16 justify-end">
                      <Eye className="h-3 w-3" />
                      <span className="font-medium text-foreground">{p.views}</span>
                    </span>
                    <span className="flex items-center gap-1 w-14 justify-end hidden md:flex">
                      <Clock className="h-3 w-3" />
                      {formatDuration(p.avgDuration)}
                    </span>
                    <span className="flex items-center gap-1 w-10 justify-end hidden md:flex">
                      <Link2 className="h-3 w-3" />
                      {p.linkClicks}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
