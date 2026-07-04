import Link from "next/link";
import type { ComponentType } from "react";
import { notFound, redirect } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  FileText,
  Globe,
  MousePointerClick,
  Share2,
  Users,
} from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { ActivityTimeline } from "@/components/activity-timeline";
import { AnalyticsStatCards } from "@/components/analytics-stat-cards";
import { BuyerAnalyticsPanel } from "@/components/buyer-analytics-panel";
import { PageAnalyticsActions } from "@/components/page-analytics-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ViewsChart } from "@/components/views-chart";
import { formatDuration, formatRelativeTime } from "@/lib/format-utils";
import { prisma } from "@/lib/prisma";
import { checkPageAccess } from "@/lib/team-auth";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CompactMetric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
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

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    viewStats,
    eventStats,
    submissionCount,
    dailyViews,
    visitorStats,
    highIntentCount,
    returningVisitors,
    contactCount,
  ] = await Promise.all([
    prisma.pageView.aggregate({
      where: { pageId },
      _count: { id: true },
      _avg: { duration: true },
    }),
    prisma.pageEvent.groupBy({
      by: ["type"],
      where: { pageId },
      _count: { id: true },
    }),
    prisma.formSubmission.count({ where: { pageId } }),
    prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT DATE_TRUNC('day', "createdAt") AS day, COUNT(*)::bigint AS count
      FROM "PageView"
      WHERE "pageId" = ${pageId}
        AND "createdAt" >= ${sevenDaysAgo}
      GROUP BY day
      ORDER BY day ASC
    `,
    prisma.buyerVisitor.aggregate({
      where: { pageId },
      _count: { id: true },
      _avg: { engagementScore: true },
    }),
    prisma.buyerVisitor.count({
      where: {
        pageId,
        OR: [{ ctaClicked: true }, { engagementScore: { gte: 70 } }],
      },
    }),
    prisma.buyerVisitor.count({
      where: { pageId, totalSessions: { gt: 1 } },
    }),
    prisma.pageContact.count({ where: { pageId } }),
  ]);

  const eventCount = (type: string) =>
    eventStats.find((event) => event.type === type)?._count.id ?? 0;

  const totalViews = viewStats._count.id;
  const avgDuration = Math.round(viewStats._avg.duration ?? 0);
  const linkClicks = eventCount("link_click");
  const shares = eventCount("share");
  const uniqueVisitors = visitorStats._count.id;
  const avgScore = Math.round(visitorStats._avg.engagementScore ?? 0);

  const dailyMap = new Map<string, number>();
  for (const row of dailyViews) {
    dailyMap.set(new Date(row.day).toISOString().slice(0, 10), Number(row.count));
  }

  const days: { label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = date.toISOString().slice(0, 10);
    days.push({
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      count: dailyMap.get(key) ?? 0,
    });
  }

  const statCards = [
    {
      label: "Total Views",
      value: totalViews.toLocaleString(),
      icon: "Eye",
      accent: "hsl(var(--primary))",
      description: "All visits recorded for this page",
    },
    {
      label: "Unique Visitors",
      value: uniqueVisitors.toLocaleString(),
      icon: "Users",
      accent: "hsl(var(--chart-2))",
      description: "Distinct tracked visitors for this page",
    },
    {
      label: "High Intent",
      value: highIntentCount.toLocaleString(),
      icon: "Target",
      accent: "hsl(var(--chart-5))",
      description: "Visitors who clicked a CTA or scored 70+",
    },
    {
      label: "Avg. Time",
      value: formatDuration(avgDuration),
      icon: "Clock",
      accent: "hsl(var(--muted-foreground))",
      description: "Average viewing time for this page",
    },
    {
      label: "Link Clicks",
      value: linkClicks.toLocaleString(),
      icon: "Link2",
      accent: "hsl(var(--muted-foreground))",
      description: "Tracked outbound link and CTA clicks",
    },
    {
      label: "Shares",
      value: shares.toLocaleString(),
      icon: "Share2",
      accent: "hsl(var(--chart-3))",
      description: "Share actions recorded for this page",
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      <AppNav />
      <PageContainer size="lg">
        <div className="mb-4">
          <Button asChild variant="ghost" size="sm" className="rounded-lg gap-1.5 px-2">
            <Link href="/dashboard">
              <ArrowLeft className="h-3.5 w-3.5" />
              Dashboard
            </Link>
          </Button>
        </div>

        <PageHeader
          title={page.title}
          description="Page analytics, buyer engagement, and activity timeline"
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
            Updated {formatRelativeTime(page.updatedAt.toISOString())}
          </span>
        </div>

        <AnalyticsStatCards cards={statCards} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <ViewsChart days={days} />

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
            <CompactMetric
              icon={MousePointerClick}
              label="Form submissions"
              value={submissionCount.toLocaleString()}
              detail="Responses captured on this page"
            />
            <CompactMetric
              icon={Share2}
              label="Shared contacts"
              value={contactCount.toLocaleString()}
              detail="Contacts with tracked share links"
            />
            <CompactMetric
              icon={Users}
              label="Return visitors"
              value={returningVisitors.toLocaleString()}
              detail="Visitors with more than one session"
            />
            <CompactMetric
              icon={BarChart3}
              label="Avg. buyer score"
              value={avgScore.toLocaleString()}
              detail="Engagement score across visitors"
            />
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              <span className="text-xs font-medium">Created</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">
              {formatDate(page.createdAt)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span className="text-xs font-medium">Last updated</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">
              {formatDate(page.updatedAt)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-medium">Public URL</span>
            </div>
            <p className="mt-3 truncate text-sm font-semibold text-foreground">
              {page.published ? `/p/${page.slug}` : "Publish to create a public link"}
            </p>
          </div>
        </div>

        <BuyerAnalyticsPanel pageId={page.id} />

        <div className="mt-6">
          <ActivityTimeline pageId={page.id} />
        </div>
      </PageContainer>
    </main>
  );
}
