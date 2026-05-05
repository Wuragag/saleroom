/**
 * GET /api/buyer/timeline/[pageId]?cursor=&limit=50&range=30d&visitorId=&types=
 *
 * Returns a reverse-chronological activity timeline for a page.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserTeamId } from "@/lib/team-auth";
import { extractEmailFromFormData } from "@/lib/timeline-utils";
import { withAuth } from "@/lib/api-auth";
import type { TimelineEvent, TimelineEventType, TimelineVisitor } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRangeDate(range: string): Date | null {
  const now = new Date();
  if (range === "7d") return new Date(now.getTime() - 7 * 86400000);
  if (range === "30d") return new Date(now.getTime() - 30 * 86400000);
  return null;
}

function parseCursor(raw: string | null): { date?: Date; lastId?: string } {
  if (!raw) return {};
  const pipeIdx = raw.indexOf("|");
  if (pipeIdx === -1) {
    // Legacy: plain ISO timestamp
    return { date: new Date(raw) };
  }
  return { date: new Date(raw.slice(0, pipeIdx)), lastId: raw.slice(pipeIdx + 1) };
}

// ---------------------------------------------------------------------------
// Row → TimelineEvent normalizers
//
// Each normalizer is pure — given a Prisma row (with the include shape used
// in this file), produce one TimelineEvent. Adding a new event type means
// adding a query + a normalizer; the handler body doesn't grow.
// ---------------------------------------------------------------------------

interface VisitorRef {
  id: string;
  visitorHash: string;
  contact: { email: string | null; name: string | null } | null;
}

interface FirstVisitRow {
  id: string;
  startedAt: Date;
  visitor: VisitorRef;
}

function normalizeFirstVisit(s: FirstVisitRow): TimelineEvent {
  return {
    id: `fv-${s.id}`,
    type: "first_visit",
    timestamp: s.startedAt.toISOString(),
    visitorHash: s.visitor.visitorHash.slice(0, 8),
    visitorId: s.visitor.id,
    visitorEmail: s.visitor.contact?.email ?? null,
    detail: { ...(s.visitor.contact?.name ? { contactName: s.visitor.contact.name } : {}) },
    isSeller: false,
  };
}

interface ReturnVisitRow extends FirstVisitRow {
  visitor: VisitorRef & { totalSessions: number };
}

function normalizeReturnVisit(s: ReturnVisitRow): TimelineEvent {
  return {
    id: `rv-${s.id}`,
    type: "return_visit",
    timestamp: s.startedAt.toISOString(),
    visitorHash: s.visitor.visitorHash.slice(0, 8),
    visitorId: s.visitor.id,
    visitorEmail: s.visitor.contact?.email ?? null,
    detail: {
      totalSessions: s.visitor.totalSessions,
      ...(s.visitor.contact?.name ? { contactName: s.visitor.contact.name } : {}),
    },
    isSeller: false,
  };
}

interface TabViewRow {
  id: string;
  tabName: string;
  duration: number;
  lastViewedAt: Date;
  session: { visitor: VisitorRef };
}

function normalizeTabView(tv: TabViewRow): TimelineEvent {
  return {
    id: `tv-${tv.id}`,
    type: "tab_viewed",
    timestamp: tv.lastViewedAt.toISOString(),
    visitorHash: tv.session.visitor.visitorHash.slice(0, 8),
    visitorId: tv.session.visitor.id,
    visitorEmail: tv.session.visitor.contact?.email ?? null,
    detail: { tabName: tv.tabName, duration: tv.duration },
    isSeller: false,
  };
}

interface BuyerEventRow {
  id: string;
  type: string;
  metadata: string;
  createdAt: Date;
  session: { visitor: VisitorRef };
}

function normalizeBuyerEvent(ev: BuyerEventRow): TimelineEvent {
  const type: TimelineEventType =
    ev.type === "CTA_CLICK" ? "cta_clicked" : "file_downloaded";
  let meta: Record<string, string> = {};
  try {
    meta = JSON.parse(ev.metadata);
  } catch {
    // empty
  }
  return {
    id: `be-${ev.id}`,
    type,
    timestamp: ev.createdAt.toISOString(),
    visitorHash: ev.session.visitor.visitorHash.slice(0, 8),
    visitorId: ev.session.visitor.id,
    visitorEmail: ev.session.visitor.contact?.email ?? null,
    detail: meta,
    isSeller: false,
  };
}

interface FormSubmissionRow {
  id: string;
  data: string;
  createdAt: Date;
}

function normalizeFormSubmission(fs: FormSubmissionRow): TimelineEvent {
  const email = extractEmailFromFormData(fs.data);
  return {
    id: `fs-${fs.id}`,
    type: "form_submitted",
    timestamp: fs.createdAt.toISOString(),
    visitorHash: null,
    visitorId: null,
    visitorEmail: email,
    detail: email ? { email } : {},
    isSeller: false,
  };
}

interface PageEventRow {
  id: string;
  createdAt: Date;
}

function normalizePageEvent(pe: PageEventRow): TimelineEvent {
  return {
    id: `pe-${pe.id}`,
    type: "link_shared",
    timestamp: pe.createdAt.toISOString(),
    visitorHash: null,
    visitorId: null,
    visitorEmail: null,
    detail: {},
    isSeller: true,
  };
}

interface MapItemRow {
  id: string;
  title: string;
  ownerType: string;
  ownerName: string | null;
  updatedAt: Date;
}

function normalizeMapItem(mi: MapItemRow): TimelineEvent {
  return {
    id: `mi-${mi.id}`,
    type: "map_item_completed",
    timestamp: mi.updatedAt.toISOString(),
    visitorHash: null,
    visitorId: null,
    visitorEmail: null,
    detail: {
      title: mi.title,
      ownerType: mi.ownerType,
      ...(mi.ownerName ? { ownerName: mi.ownerName } : {}),
    },
    isSeller: mi.ownerType === "seller",
  };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export const GET = withAuth<{ pageId: string }>(async (req, { params, session }) => {
  const { pageId } = await params;
  const url = (req as NextRequest).nextUrl.searchParams;
  const range = url.get("range") ?? "30d";
  const cursorRaw = url.get("cursor");
  const limit = Math.min(Number(url.get("limit") ?? 50), 100);
  const visitorFilter = url.get("visitorId");
  const typeFilter = url.get("types")?.split(",").filter(Boolean) as TimelineEventType[] | undefined;

  // Auth: verify page access
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: { userId: true, teamId: true },
  });
  if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });

  const teamId = await getUserTeamId(session.user.id);
  const hasAccess = page.userId === session.user.id || (teamId && page.teamId === teamId);
  if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sinceDate = getRangeDate(range);
  const { date: cursorDate, lastId: cursorLastId } = parseCursor(cursorRaw);

  // Build date filter — gte for the rolling window, lte for the cursor.
  const dateFilter = (field: string) => {
    const conditions: Record<string, Date>[] = [];
    if (sinceDate) conditions.push({ gte: sinceDate });
    if (cursorDate) conditions.push({ lte: cursorDate });
    return conditions.length > 0
      ? { [field]: Object.assign({}, ...conditions) }
      : {};
  };

  const visitorIds = visitorFilter ? [visitorFilter] : undefined;
  const visitorWhere = visitorIds ? { visitorId: { in: visitorIds } } : {};

  // ── 7 parallel queries ──
  const [
    firstVisitSessions,
    returnVisitSessions,
    tabViews,
    buyerEvents,
    formSubmissions,
    pageEvents,
    completedMapItems,
  ] = await Promise.all([
    prisma.buyerSession.findMany({
      where: { pageId, isReturn: false, ...visitorWhere, ...dateFilter("startedAt") },
      include: { visitor: { select: { id: true, visitorHash: true, contact: { select: { email: true, name: true } } } } },
      orderBy: { startedAt: "desc" },
      take: limit + 1,
    }),
    prisma.buyerSession.findMany({
      where: { pageId, isReturn: true, ...visitorWhere, ...dateFilter("startedAt") },
      include: {
        visitor: { select: { id: true, visitorHash: true, totalSessions: true, contact: { select: { email: true, name: true } } } },
      },
      orderBy: { startedAt: "desc" },
      take: limit + 1,
    }),
    prisma.buyerTabView.findMany({
      where: {
        session: { pageId, ...visitorWhere },
        duration: { gte: 30 },
        ...dateFilter("lastViewedAt"),
      },
      include: {
        session: { select: { visitor: { select: { id: true, visitorHash: true, contact: { select: { email: true, name: true } } } } } },
      },
      orderBy: { lastViewedAt: "desc" },
      take: limit + 1,
    }),
    prisma.buyerEvent.findMany({
      where: {
        session: { pageId, ...visitorWhere },
        type: { in: ["CTA_CLICK", "FILE_DOWNLOAD"] },
        ...dateFilter("createdAt"),
      },
      include: {
        session: { select: { visitor: { select: { id: true, visitorHash: true, contact: { select: { email: true, name: true } } } } } },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    }),
    !visitorFilter
      ? prisma.formSubmission.findMany({
          where: { pageId, ...dateFilter("createdAt") },
          orderBy: { createdAt: "desc" },
          take: limit + 1,
        })
      : Promise.resolve([]),
    !visitorFilter
      ? prisma.pageEvent.findMany({
          where: { pageId, type: "share", ...dateFilter("createdAt") },
          orderBy: { createdAt: "desc" },
          take: limit + 1,
        })
      : Promise.resolve([]),
    !visitorFilter
      ? prisma.mapItem.findMany({
          where: { map: { pageId }, completed: true, ...dateFilter("updatedAt") },
          include: { map: { select: { pageId: true } } },
          orderBy: { updatedAt: "desc" },
          take: limit + 1,
        })
      : Promise.resolve([]),
  ]);

  // ── Normalize all rows → TimelineEvent[] ──
  const events: TimelineEvent[] = [
    ...firstVisitSessions.map(normalizeFirstVisit),
    ...returnVisitSessions.map(normalizeReturnVisit),
    ...tabViews.map(normalizeTabView),
    ...buyerEvents.map(normalizeBuyerEvent),
    ...formSubmissions.map(normalizeFormSubmission),
    ...pageEvents.map(normalizePageEvent),
    ...completedMapItems.map(normalizeMapItem),
  ];

  // ── Filter → sort desc → cursor-paginate ──
  const filtered = typeFilter?.length
    ? events.filter((e) => typeFilter.includes(e.type))
    : events;

  filtered.sort((a, b) => {
    const diff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    return diff !== 0 ? diff : a.id.localeCompare(b.id);
  });

  let startIdx = 0;
  if (cursorLastId) {
    const idx = filtered.findIndex((e) => e.id === cursorLastId);
    if (idx !== -1) startIdx = idx + 1;
  }

  const remaining = filtered.slice(startIdx);
  const hasMore = remaining.length > limit;
  const pageEventsResult = remaining.slice(0, limit);
  const lastEvent = pageEventsResult[pageEventsResult.length - 1];
  const nextCursor = hasMore && lastEvent
    ? `${lastEvent.timestamp}|${lastEvent.id}`
    : null;

  // ── First request: also build the visitor list for filter dropdown ──
  let visitors: TimelineVisitor[] = [];
  if (!cursorRaw) {
    const allVisitors = await prisma.buyerVisitor.findMany({
      where: { pageId },
      select: { id: true, visitorHash: true, contact: { select: { email: true, name: true } } },
      orderBy: { lastSeenAt: "desc" },
      take: 100,
    });
    visitors = allVisitors.map((v) => ({
      id: v.id,
      hash: v.contact?.name ?? v.contact?.email ?? v.visitorHash.slice(0, 8),
      email: v.contact?.email ?? null,
    }));
  }

  return NextResponse.json({
    events: pageEventsResult,
    nextCursor,
    visitors,
  });
});
