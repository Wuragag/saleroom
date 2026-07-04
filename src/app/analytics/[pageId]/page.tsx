import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, FileText, Globe } from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { ActivityTimeline } from "@/components/activity-timeline";
import { AnalyticsStatCards } from "@/components/analytics-stat-cards";
import { BuyerAnalyticsPanel } from "@/components/buyer-analytics-panel";
import { PageAnalyticsActions } from "@/components/page-analytics-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { SectionEngagementPanel } from "@/components/section-engagement-panel";
import { HIGH_INTENT_VISITOR_WHERE } from "@/lib/engagement-score";
import { formatDuration, formatRelativeTime } from "@/lib/format-utils";
import { prisma } from "@/lib/prisma";
import { aggregateSections, mergeWithPageTabs } from "@/lib/section-engagement";
import { checkPageAccess } from "@/lib/team-auth";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function PageAnalyticsDetail({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;

  const viewAccess = await checkPageAccess(pageId, "view");
  if (!viewAccess.session) redirect("/auth/signin");
  if (!viewAccess.authorized) notFound();

  const [editAccess, page] = await Promise.all([
    checkPageAccess(pageId, "edit"),
    prisma.page.findUnique({
      where: { id: pageId },
      select: {
        id: true,
        title: true,
        slug: true,
        published: true,
        updatedAt: true,
        createdAt: true,
        visibility: true,
        lockedById: true,
        lockedBy: { select: { name: true } },
      },
    }),
  ]);

  if (!page) notFound();

  const [
    viewStats,
    highIntentCount,
    tabs,
    buyerSessions,
  ] = await Promise.all([
    prisma.pageView.aggregate({
      where: { pageId },
      _count: { id: true },
      _sum: { duration: true },
      _max: { createdAt: true },
    }),
    prisma.buyerVisitor.count({
      where: { pageId, ...HIGH_INTENT_VISITOR_WHERE },
    }),
    prisma.tab.findMany({
      where: { pageId },
      select: { id: true, name: true },
      orderBy: { order: "asc" },
    }),
    prisma.buyerSession.findMany({
      where: { pageId },
      select: {
        tabViews: {
          select: { tabId: true, tabName: true, duration: true, viewCount: true },
        },
      },
      take: 1000,
    }),
  ]);

  const totalViews = viewStats._count.id;
  const totalDuration = viewStats._sum.duration ?? 0;
  const lastViewedAt = viewStats._max.createdAt;

  // Deck-order section engagement across all buyer sessions; unopened tabs
  // stay visible as explicit "Not viewed" rows.
  const sections = mergeWithPageTabs(
    aggregateSections(
      buyerSessions.map((s) => ({ tabViews: s.tabViews, scrollEvents: [] }))
    ),
    tabs
  );

  // A page is typically shared with one or two buyers, so the headline
  // metrics are the deal-pulse questions a rep asks after sending it:
  // opened? coming back? reading deeply? ready to act? Per-visitor detail
  // lives in the Buyer Analytics table below.
  const statCards = [
    {
      label: "Last Viewed",
      value: lastViewedAt ? formatRelativeTime(lastViewedAt.toISOString()) : "Not yet",
      icon: "Activity",
      accent: "hsl(var(--primary))",
      description: "Most recent visit to this page",
    },
    {
      label: "Views",
      value: totalViews.toLocaleString(),
      icon: "Eye",
      accent: "hsl(var(--chart-1))",
      description: "Total opens — repeat views signal interest",
    },
    {
      label: "Time Spent",
      value: formatDuration(totalDuration),
      icon: "Clock",
      accent: "hsl(var(--chart-4))",
      description: "Combined viewing time across all visits",
    },
    {
      label: "High Intent",
      value: highIntentCount.toLocaleString(),
      icon: "Target",
      accent: "hsl(var(--chart-5))",
      description: "Visitors who clicked a CTA, viewed pricing, or scored 70+",
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      <AppNav />
      <PageContainer size="lg">
        <div className="mb-4">
          <Button asChild variant="ghost" size="sm" className="rounded-lg gap-1.5 px-2">
            <Link href="/analytics">
              <ArrowLeft className="h-3.5 w-3.5" />
              Analytics
            </Link>
          </Button>
        </div>

        <PageHeader
          title={page.title}
          className="mb-5"
          actions={
            <PageAnalyticsActions
              pageId={page.id}
              slug={page.slug}
              title={page.title}
              published={page.published}
              canShare={editAccess.authorized}
            />
          }
        />

        <div className="mb-6 flex flex-wrap items-center gap-2">
          {page.published ? (
            <Badge variant="success" className="gap-1 rounded-full">
              <Globe className="h-3 w-3" />
              Published
            </Badge>
          ) : (
            <Badge variant="neutral" className="gap-1 rounded-full">
              <FileText className="h-3 w-3" />
              Draft
            </Badge>
          )}
          <Badge variant={page.visibility === "PRIVATE" ? "warning" : "neutral"} className="rounded-full">
            {page.visibility === "PRIVATE" ? "Private" : "Team visible"}
          </Badge>
          {page.lockedById && (
            <Badge variant="warning" className="rounded-full">
              Locked by {page.lockedBy?.name ?? "another user"}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            Created {formatDate(page.createdAt)}
          </span>
          <span className="text-xs text-muted-foreground" aria-hidden="true">·</span>
          <span className="text-xs text-muted-foreground">
            Updated {formatRelativeTime(page.updatedAt.toISOString())}
          </span>
          {page.published && (
            <>
              <span className="text-xs text-muted-foreground" aria-hidden="true">·</span>
              <Link
                href={`/p/${page.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Globe className="h-3 w-3" />
                /p/{page.slug}
              </Link>
            </>
          )}
        </div>

        <AnalyticsStatCards cards={statCards} />

        <div className="mb-6">
          <SectionEngagementPanel sections={sections} />
        </div>

        <BuyerAnalyticsPanel pageId={page.id} />

        <div className="mt-6">
          <ActivityTimeline pageId={page.id} />
        </div>
      </PageContainer>
    </main>
  );
}
