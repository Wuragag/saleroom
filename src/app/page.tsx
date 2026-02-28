import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/app-nav";
import { DashboardHeader } from "@/components/dashboard-header";
import { SortableDashboard } from "@/components/sortable-dashboard";
import type { PageAnalytics, PageListItem } from "@/types";

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const pages = await prisma.page.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { user: { select: { name: true } } },
  });

  const analyticsMap = Object.fromEntries(
    await Promise.all(
      pages.map(async (page) => {
        const [viewStats, eventStats] = await Promise.all([
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
        const analytics: PageAnalytics = {
          views: viewStats._count.id,
          avgDuration: Math.round(viewStats._avg.duration ?? 0),
          linkClicks:
            eventStats.find((e) => e.type === "link_click")?._count.id ?? 0,
          shares:
            eventStats.find((e) => e.type === "share")?._count.id ?? 0,
        };
        return [page.id, analytics] as const;
      })
    )
  );

  const pageItems: PageListItem[] = pages.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    published: p.published,
    accentColor: p.accentColor,
    background: p.background,
    tags: (() => { try { return JSON.parse(p.tags ?? "[]"); } catch { return []; } })(),
    updatedAt: p.updatedAt.toISOString(),
    createdAt: p.createdAt.toISOString(),
    user: { name: p.user.name },
  }));

  return (
    <main className="min-h-screen bg-background">
      <AppNav />
      <div className="max-w-5xl mx-auto px-6 py-6">
        <DashboardHeader />
        <div className="mt-6">
          <SortableDashboard pages={pageItems} analyticsMap={analyticsMap} />
        </div>
      </div>
    </main>
  );
}
