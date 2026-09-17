/**
 * Workspace-level "Recent Activity": buyer engagement events across every
 * page the caller can see, merged into one reverse-chronological stream. A
 * deliberate subset of the per-page timeline — high-signal buyer actions only
 * (visits, CTA clicks, downloads, form submissions, completed MAP steps), no
 * chatty tab views or seller share events.
 *
 * Shared by GET /api/activity (dashboard drawer) and the MCP
 * `get_recent_activity` tool so both surfaces show the same feed.
 */
import { prisma } from "@/lib/prisma";
import { accessiblePageWhere } from "@/lib/team-auth";
import { extractEmailFromFormData } from "@/lib/timeline-utils";
import type { ActivityFeedItem, TimelineEventType } from "@/types";
import { isForwardedVisitor } from "@/lib/page-gate";

/** Look-back window keeps the queries bounded; the feed only shows recent pulse. */
export const ACTIVITY_SINCE_DAYS = 30;
export const ACTIVITY_MAX_LIMIT = 50;

export async function listWorkspaceActivity(
  userId: string,
  teamId: string | null,
  limit: number
): Promise<ActivityFeedItem[]> {
  const cappedLimit = Math.min(Math.max(1, limit), ACTIVITY_MAX_LIMIT);
  // Fetch at least `limit` from each source so a single high-volume source
  // can't starve genuinely-recent items out of the merged top-N.
  const perSource = Math.max(cappedLimit, 25);
  const since = new Date(Date.now() - ACTIVITY_SINCE_DAYS * 86400000);

  // Pages the caller may see → id set + a lookup for titles.
  const pages = await prisma.page.findMany({
    where: accessiblePageWhere(userId, teamId),
    select: { id: true, title: true },
  });
  if (pages.length === 0) return [];
  const pageIds = pages.map((p) => p.id);
  const pageMap = new Map(pages.map((p) => [p.id, p]));

  const visitorSelect = {
    select: {
      visitorHash: true,
      contactId: true,
      referredByContactId: true,
      contact: { select: { email: true, name: true } },
      referredBy: { select: { email: true, name: true } },
    },
  } as const;

  const [sessions, buyerEvents, formSubmissions, completedMapItems] =
    await Promise.all([
      // Visits (first + return) — the "viewed / came back to" rows.
      prisma.buyerSession.findMany({
        where: { pageId: { in: pageIds }, startedAt: { gte: since } },
        select: {
          id: true,
          pageId: true,
          startedAt: true,
          isReturn: true,
          duration: true,
          visitor: visitorSelect,
        },
        orderBy: { startedAt: "desc" },
        take: perSource,
      }),
      // CTA clicks + file downloads.
      prisma.buyerEvent.findMany({
        where: {
          session: { pageId: { in: pageIds } },
          type: { in: ["CTA_CLICK", "FILE_DOWNLOAD"] },
          createdAt: { gte: since },
        },
        select: {
          id: true,
          type: true,
          metadata: true,
          createdAt: true,
          session: { select: { pageId: true, visitor: visitorSelect } },
        },
        orderBy: { createdAt: "desc" },
        take: perSource,
      }),
      // Form submissions (buyer left contact details).
      prisma.formSubmission.findMany({
        where: { pageId: { in: pageIds }, createdAt: { gte: since } },
        select: { id: true, pageId: true, data: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: perSource,
      }),
      // Mutual-action-plan items the buyer completed.
      prisma.mapItem.findMany({
        where: {
          map: { pageId: { in: pageIds } },
          completed: true,
          ownerType: "buyer",
          updatedAt: { gte: since },
        },
        select: {
          id: true,
          title: true,
          updatedAt: true,
          map: { select: { pageId: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: perSource,
      }),
    ]);

  const items: ActivityFeedItem[] = [];

  const pushItem = (
    pageId: string,
    partial: Omit<ActivityFeedItem, "page">
  ) => {
    const page = pageMap.get(pageId);
    if (!page) return; // page no longer accessible — skip defensively
    items.push({ ...partial, page });
  };

  for (const s of sessions) {
    pushItem(s.pageId, {
      id: `sv-${s.id}`,
      type: s.isReturn ? "return_visit" : "first_visit",
      timestamp: s.startedAt.toISOString(),
      actorName: s.visitor.contact?.name ?? null,
      actorEmail: s.visitor.contact?.email ?? null,
      actorHash: s.visitor.contact ? null : s.visitor.visitorHash.slice(0, 8),
      detail: {
        ...(s.duration > 0 ? { duration: s.duration } : {}),
        ...(!s.isReturn && isForwardedVisitor(s.visitor) && s.visitor.referredBy
          ? { via: s.visitor.referredBy.name || s.visitor.referredBy.email }
          : {}),
      },
    });
  }

  for (const ev of buyerEvents) {
    const type: TimelineEventType =
      ev.type === "CTA_CLICK" ? "cta_clicked" : "file_downloaded";
    let meta: Record<string, string> = {};
    try {
      meta = JSON.parse(ev.metadata);
    } catch {
      /* ignore malformed metadata */
    }
    pushItem(ev.session.pageId, {
      id: `be-${ev.id}`,
      type,
      timestamp: ev.createdAt.toISOString(),
      actorName: ev.session.visitor.contact?.name ?? null,
      actorEmail: ev.session.visitor.contact?.email ?? null,
      actorHash: ev.session.visitor.contact
        ? null
        : ev.session.visitor.visitorHash.slice(0, 8),
      detail: meta,
    });
  }

  for (const fs of formSubmissions) {
    const email = extractEmailFromFormData(fs.data);
    pushItem(fs.pageId, {
      id: `fs-${fs.id}`,
      type: "form_submitted",
      timestamp: fs.createdAt.toISOString(),
      actorName: null,
      actorEmail: email,
      actorHash: null,
      detail: email ? { email } : {},
    });
  }

  for (const mi of completedMapItems) {
    pushItem(mi.map.pageId, {
      id: `mi-${mi.id}`,
      type: "map_item_completed",
      timestamp: mi.updatedAt.toISOString(),
      actorName: null,
      actorEmail: null,
      actorHash: null,
      detail: { title: mi.title },
    });
  }

  items.sort((a, b) => {
    const diff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    return diff !== 0 ? diff : a.id.localeCompare(b.id);
  });

  return items.slice(0, cappedLimit);
}
