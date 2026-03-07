/**
 * GET /api/buyer/timeline/[pageId]?cursor=&limit=50&range=30d&visitorId=&types=
 *
 * Returns a reverse-chronological activity timeline for a page.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { extractEmailFromFormData } from "@/lib/timeline-utils";
import type { TimelineEvent, TimelineEventType, TimelineVisitor } from "@/types";

function getRangeDate(range: string): Date | null {
  const now = new Date();
  if (range === "7d") return new Date(now.getTime() - 7 * 86400000);
  if (range === "30d") return new Date(now.getTime() - 30 * 86400000);
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { pageId } = await params;
    const url = req.nextUrl.searchParams;
    const range = url.get("range") ?? "30d";
    const cursor = url.get("cursor"); // ISO timestamp
    const limit = Math.min(Number(url.get("limit") ?? 50), 100);
    const visitorFilter = url.get("visitorId");
    const typeFilter = url.get("types")?.split(",").filter(Boolean) as TimelineEventType[] | undefined;

    // Auth: verify page access
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { userId: true, teamId: true },
    });
    if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });

    const teamId = (session.user as { teamId?: string }).teamId;
    const hasAccess = page.userId === session.user.id || (teamId && page.teamId === teamId);
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const sinceDate = getRangeDate(range);
    const cursorDate = cursor ? new Date(cursor) : undefined;

    // Build date filter helper
    const dateFilter = (field: string) => {
      const conditions: Record<string, Date>[] = [];
      if (sinceDate) conditions.push({ gte: sinceDate });
      if (cursorDate) conditions.push({ lt: cursorDate });
      return conditions.length > 0
        ? { [field]: Object.assign({}, ...conditions) }
        : {};
    };

    // Gather visitor IDs for filtering if needed
    let visitorIds: string[] | undefined;
    if (visitorFilter) {
      visitorIds = [visitorFilter];
    }

    // ── Run 7 parallel queries ──
    const [
      firstVisitSessions,
      returnVisitSessions,
      tabViews,
      buyerEvents,
      formSubmissions,
      pageEvents,
      completedMapItems,
    ] = await Promise.all([
      // 1. First visits (BuyerSession where isReturn=false)
      prisma.buyerSession.findMany({
        where: {
          pageId,
          isReturn: false,
          ...(visitorIds ? { visitorId: { in: visitorIds } } : {}),
          ...dateFilter("startedAt"),
        },
        include: { visitor: { select: { id: true, visitorHash: true } } },
        orderBy: { startedAt: "desc" },
        take: limit + 1,
      }),

      // 2. Return visits
      prisma.buyerSession.findMany({
        where: {
          pageId,
          isReturn: true,
          ...(visitorIds ? { visitorId: { in: visitorIds } } : {}),
          ...dateFilter("startedAt"),
        },
        include: {
          visitor: { select: { id: true, visitorHash: true, totalSessions: true } },
        },
        orderBy: { startedAt: "desc" },
        take: limit + 1,
      }),

      // 3. Tab views (duration >= 30s)
      prisma.buyerTabView.findMany({
        where: {
          session: {
            pageId,
            ...(visitorIds ? { visitorId: { in: visitorIds } } : {}),
          },
          duration: { gte: 30 },
          ...dateFilter("lastViewedAt"),
        },
        include: {
          session: {
            select: { visitor: { select: { id: true, visitorHash: true } } },
          },
        },
        orderBy: { lastViewedAt: "desc" },
        take: limit + 1,
      }),

      // 4. Buyer events (CTA_CLICK, FILE_DOWNLOAD)
      prisma.buyerEvent.findMany({
        where: {
          session: {
            pageId,
            ...(visitorIds ? { visitorId: { in: visitorIds } } : {}),
          },
          type: { in: ["CTA_CLICK", "FILE_DOWNLOAD"] },
          ...dateFilter("createdAt"),
        },
        include: {
          session: {
            select: { visitor: { select: { id: true, visitorHash: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
      }),

      // 5. Form submissions
      (!visitorFilter
        ? prisma.formSubmission.findMany({
            where: { pageId, ...dateFilter("createdAt") },
            orderBy: { createdAt: "desc" },
            take: limit + 1,
          })
        : Promise.resolve([])),

      // 6. Page events (share)
      (!visitorFilter
        ? prisma.pageEvent.findMany({
            where: { pageId, type: "share", ...dateFilter("createdAt") },
            orderBy: { createdAt: "desc" },
            take: limit + 1,
          })
        : Promise.resolve([])),

      // 7. Completed MAP items
      (!visitorFilter
        ? prisma.mapItem.findMany({
            where: {
              map: { pageId },
              completed: true,
              ...dateFilter("updatedAt"),
            },
            include: { map: { select: { pageId: true } } },
            orderBy: { updatedAt: "desc" },
            take: limit + 1,
          })
        : Promise.resolve([])),
    ]);

    // ── Normalize into TimelineEvent[] ──
    const events: TimelineEvent[] = [];

    for (const s of firstVisitSessions) {
      events.push({
        id: `fv-${s.id}`,
        type: "first_visit",
        timestamp: s.startedAt.toISOString(),
        visitorHash: s.visitor.visitorHash.slice(0, 8),
        visitorId: s.visitor.id,
        visitorEmail: null,
        detail: {},
        isSeller: false,
      });
    }

    for (const s of returnVisitSessions) {
      events.push({
        id: `rv-${s.id}`,
        type: "return_visit",
        timestamp: s.startedAt.toISOString(),
        visitorHash: s.visitor.visitorHash.slice(0, 8),
        visitorId: s.visitor.id,
        visitorEmail: null,
        detail: { totalSessions: s.visitor.totalSessions },
        isSeller: false,
      });
    }

    for (const tv of tabViews) {
      events.push({
        id: `tv-${tv.id}`,
        type: "tab_viewed",
        timestamp: tv.lastViewedAt.toISOString(),
        visitorHash: tv.session.visitor.visitorHash.slice(0, 8),
        visitorId: tv.session.visitor.id,
        visitorEmail: null,
        detail: { tabName: tv.tabName, duration: tv.duration },
        isSeller: false,
      });
    }

    for (const ev of buyerEvents) {
      const type: TimelineEventType =
        ev.type === "CTA_CLICK" ? "cta_clicked" : "file_downloaded";
      let meta: Record<string, string> = {};
      try { meta = JSON.parse(ev.metadata); } catch { /* empty */ }
      events.push({
        id: `be-${ev.id}`,
        type,
        timestamp: ev.createdAt.toISOString(),
        visitorHash: ev.session.visitor.visitorHash.slice(0, 8),
        visitorId: ev.session.visitor.id,
        visitorEmail: null,
        detail: meta,
        isSeller: false,
      });
    }

    for (const fs of formSubmissions) {
      const email = extractEmailFromFormData(fs.data);
      events.push({
        id: `fs-${fs.id}`,
        type: "form_submitted",
        timestamp: fs.createdAt.toISOString(),
        visitorHash: null,
        visitorId: null,
        visitorEmail: email,
        detail: email ? { email } : {},
        isSeller: false,
      });
    }

    for (const pe of pageEvents) {
      events.push({
        id: `pe-${pe.id}`,
        type: "link_shared",
        timestamp: pe.createdAt.toISOString(),
        visitorHash: null,
        visitorId: null,
        visitorEmail: null,
        detail: {},
        isSeller: true,
      });
    }

    for (const mi of completedMapItems) {
      events.push({
        id: `mi-${mi.id}`,
        type: "map_item_completed",
        timestamp: mi.updatedAt.toISOString(),
        visitorHash: null,
        visitorId: null,
        visitorEmail: null,
        detail: { title: mi.title, ownerType: mi.ownerType, ownerName: mi.ownerName },
        isSeller: mi.ownerType === "seller",
      });
    }

    // ── Apply type filter ──
    let filtered = typeFilter?.length
      ? events.filter((e) => typeFilter.includes(e.type))
      : events;

    // ── Sort desc by timestamp ──
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // ── Cursor-based pagination ──
    const hasMore = filtered.length > limit;
    const page_events = filtered.slice(0, limit);
    const nextCursor = hasMore ? page_events[page_events.length - 1].timestamp : null;

    // ── Build visitor list for filter dropdown (first request only) ──
    let visitors: TimelineVisitor[] = [];
    if (!cursor) {
      const allVisitors = await prisma.buyerVisitor.findMany({
        where: { pageId },
        select: { id: true, visitorHash: true },
        orderBy: { lastSeenAt: "desc" },
      });
      visitors = allVisitors.map((v) => ({
        id: v.id,
        hash: v.visitorHash.slice(0, 8),
        email: null,
      }));
    }

    return NextResponse.json({
      events: page_events,
      nextCursor,
      visitors,
    });
  } catch (err) {
    console.error("[buyer/timeline GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
