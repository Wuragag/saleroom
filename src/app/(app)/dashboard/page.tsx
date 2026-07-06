import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardStats } from "@/components/dashboard-stats";
import { SortableDashboard } from "@/components/sortable-dashboard";
import { getUserTeamId } from "@/lib/team-auth";
import { ProductTour } from "@/components/tour/product-tour";
import type { PageAnalytics, PageListItem } from "@/types";

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  // Check onboarding from DB (not JWT) to avoid stale-token redirect loops
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingCompleted: true },
  });
  if (!currentUser?.onboardingCompleted) redirect("/onboarding");

  const teamId = await getUserTeamId(session.user.id);

  // Show team pages (TEAM visibility) + user's own private pages
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
    include: {
      user: { select: { name: true } },
      lockedBy: { select: { name: true } },
    },
  });

  const pageIds = pages.map((p) => p.id);

  // Batched analytics: 2 queries instead of 2*N
  const [viewsByPage, eventsByPage] = await Promise.all([
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
  ]);

  const viewsMap = new Map(viewsByPage.map((v) => [v.pageId, v]));
  const linkClicksMap = new Map<string, number>();
  const sharesMap = new Map<string, number>();
  for (const e of eventsByPage) {
    if (e.type === "link_click") linkClicksMap.set(e.pageId, e._count.id);
    if (e.type === "share") sharesMap.set(e.pageId, e._count.id);
  }

  const analyticsMap: Record<string, PageAnalytics> = {};
  for (const page of pages) {
    const vs = viewsMap.get(page.id);
    analyticsMap[page.id] = {
      views: vs?._count.id ?? 0,
      avgDuration: Math.round(vs?._avg.duration ?? 0),
      linkClicks: linkClicksMap.get(page.id) ?? 0,
      shares: sharesMap.get(page.id) ?? 0,
    };
  }

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
    visibility: p.visibility,
    lockedById: p.lockedById,
    lockedByName: p.lockedBy?.name ?? null,
  }));

  const totalViews = Object.values(analyticsMap).reduce((s, a) => s + a.views, 0);
  const weighted = Object.values(analyticsMap).reduce(
    (s, a) => s + a.avgDuration * a.views,
    0
  );
  const avgDuration = totalViews > 0 ? Math.round(weighted / totalViews) : 0;
  const livePages = pages.filter((p) => p.published).length;

  return (
    <AppShell>
      <DashboardHeader />
      <div className="mt-6">
        <DashboardStats
          totalViews={totalViews}
          avgDuration={avgDuration}
          livePages={livePages}
        />
      </div>
      <div className="mt-6">
        <SortableDashboard pages={pageItems} analyticsMap={analyticsMap} />
      </div>
      <ProductTour />
    </AppShell>
  );
}
