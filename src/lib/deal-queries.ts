import { prisma } from "@/lib/prisma";
import { accessibleDealWhere, canViewLinkedPage } from "@/lib/deal-auth";
import {
  HIGH_INTENT_VISITOR_WHERE,
  getIntentLabel,
  isPricingTabName,
} from "@/lib/engagement-score";
import {
  rollupDealEngagement,
  type DealPageEngagement,
} from "@/lib/deal-engagement";
import type {
  DealDetailData,
  DealListItem,
  DealMapSummary,
  DealOwnerData,
  DealRoomDetail,
  DealStakeholderRow,
  DealStakeholderSuggestion,
} from "@/types";

// Server-only Prisma queries shared by the /deals RSC pages and the deal API
// routes, so both surfaces report identical numbers. Engagement reads follow
// the analytics-overview pattern: batched groupBy(["pageId"]) over all linked
// pageIds instead of per-deal queries, and always the STORED
// BuyerVisitor.engagementScore column (never recomputed) so counts agree with
// HIGH_INTENT_VISITOR_WHERE everywhere else.

const iso = (d: Date | null | undefined): string | null =>
  d ? d.toISOString() : null;

const OWNER_SELECT = {
  id: true,
  name: true,
  lastName: true,
  avatarUrl: true,
} as const;

// Deliberately no slug: deal surfaces never need the public /p URL, and a
// linked PRIVATE room's link must stay behind the page ACL.
const PAGE_SELECT = {
  id: true,
  title: true,
  published: true,
} as const;

// Detail needs the ACL inputs for canViewLinkedPage; they are stripped before
// the response is built.
const DETAIL_PAGE_SELECT = {
  ...PAGE_SELECT,
  userId: true,
  visibility: true,
  teamId: true,
} as const;

interface PageEngagementAggregates {
  perPage: Map<string, DealPageEngagement>;
}

/** Two batched groupBys → per-page engagement inputs for the rollup. */
async function loadPageEngagement(
  pageIds: string[]
): Promise<PageEngagementAggregates> {
  const perPage = new Map<string, DealPageEngagement>();
  if (pageIds.length === 0) return { perPage };

  const [visitorsByPage, highIntentByPage] = await Promise.all([
    prisma.buyerVisitor.groupBy({
      by: ["pageId"],
      where: { pageId: { in: pageIds } },
      _count: { id: true },
      _max: { lastSeenAt: true, engagementScore: true },
    }),
    prisma.buyerVisitor.groupBy({
      by: ["pageId"],
      where: { pageId: { in: pageIds }, ...HIGH_INTENT_VISITOR_WHERE },
      _count: { id: true },
    }),
  ]);

  const highIntentMap = new Map(
    highIntentByPage.map((h) => [h.pageId, h._count.id])
  );
  for (const v of visitorsByPage) {
    perPage.set(v.pageId, {
      pageId: v.pageId,
      lastSeenAt: v._max.lastSeenAt,
      topScore: v._max.engagementScore ?? 0,
      visitorCount: v._count.id,
      highIntentCount: highIntentMap.get(v.pageId) ?? 0,
    });
  }
  return { perPage };
}

function emptyPageEngagement(pageId: string): DealPageEngagement {
  return {
    pageId,
    lastSeenAt: null,
    topScore: 0,
    visitorCount: 0,
    highIntentCount: 0,
  };
}

/** Owner-picker options: the team roster, or just the user when teamless. */
export async function getMemberOptions(
  userId: string,
  teamId: string | null
): Promise<DealOwnerData[]> {
  if (teamId) {
    const members = await prisma.teamMember.findMany({
      where: { teamId },
      select: { user: { select: OWNER_SELECT } },
      orderBy: { createdAt: "asc" },
    });
    return members.map((m) => m.user);
  }
  const self = await prisma.user.findUnique({
    where: { id: userId },
    select: OWNER_SELECT,
  });
  return self ? [self] : [];
}

/** All deals the user can see, each with its engagement rollup. */
export async function listDealsWithRollups(
  userId: string,
  teamId: string | null
): Promise<DealListItem[]> {
  const deals = await prisma.deal.findMany({
    where: accessibleDealWhere(userId, teamId),
    include: {
      owner: { select: OWNER_SELECT },
      stage: { select: { id: true, name: true } },
      pages: { select: PAGE_SELECT },
      _count: { select: { stakeholders: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const pageIds = deals.flatMap((d) => d.pages.map((p) => p.id));
  const { perPage } = await loadPageEngagement(pageIds);

  return deals.map((deal) => {
    const rollup = rollupDealEngagement(
      deal.pages.map((p) => perPage.get(p.id) ?? emptyPageEngagement(p.id))
    );
    return {
      id: deal.id,
      name: deal.name,
      company: deal.company,
      value: deal.value,
      stage: deal.stage,
      stageEnteredAt: deal.stageEnteredAt.toISOString(),
      status: deal.status,
      expectedCloseDate: iso(deal.expectedCloseDate),
      closedAt: iso(deal.closedAt),
      owner: deal.owner,
      pages: deal.pages,
      stakeholderCount: deal._count.stakeholders,
      engagement: {
        lastActivityAt: iso(rollup.lastActivityAt),
        intent: rollup.intent,
        topScore: rollup.topScore,
      },
      createdAt: deal.createdAt.toISOString(),
      updatedAt: deal.updatedAt.toISOString(),
    };
  });
}

/**
 * One deal with everything the detail page shows: per-room engagement,
 * stakeholders (engagement matched via PageContact email), add-suggestions
 * from room contacts, and read-only MAP summaries. Deal-level access control
 * is the caller's job (checkDealAccess / accessibleDealWhere); page-gated
 * content inside the deal follows the page ACL via the viewer arguments —
 * rooms the viewer can't open themselves contribute only title + engagement
 * summary (no MAP items, no contact suggestions, no room links).
 */
export async function getDealDetail(
  dealId: string,
  viewerId: string,
  viewerTeamId: string | null
): Promise<DealDetailData | null> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      owner: { select: OWNER_SELECT },
      stage: { select: { id: true, name: true } },
      pages: { select: DETAIL_PAGE_SELECT },
      stakeholders: { orderBy: { createdAt: "asc" } },
      comments: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: OWNER_SELECT } },
      },
    },
  });
  if (!deal) return null;

  const pageIds = deal.pages.map((p) => p.id);
  const viewablePageIds = deal.pages
    .filter((p) => canViewLinkedPage(p, viewerId, viewerTeamId))
    .map((p) => p.id);
  const viewableSet = new Set(viewablePageIds);

  const [{ perPage }, viewsByPage, maps, contacts] = await Promise.all([
    loadPageEngagement(pageIds),
    pageIds.length
      ? prisma.pageView.groupBy({
          by: ["pageId"],
          where: { pageId: { in: pageIds } },
          _count: { id: true },
        })
      : Promise.resolve([]),
    viewablePageIds.length
      ? prisma.mutualActionPlan.findMany({
          where: { pageId: { in: viewablePageIds } },
          include: { items: { orderBy: { order: "asc" } } },
        })
      : Promise.resolve([]),
    // Contacts from every linked room feed the stakeholder warmth match
    // (aggregate signal), but only viewable rooms' contacts may surface as
    // suggestions below. Explicit select — refToken is a bearer credential
    // and must never ride along.
    pageIds.length
      ? prisma.pageContact.findMany({
          where: { pageId: { in: pageIds } },
          select: {
            pageId: true,
            email: true,
            name: true,
            company: true,
            visitors: {
              select: {
                lastSeenAt: true,
                engagementScore: true,
                ctaClicked: true,
                sessions: {
                  select: {
                    tabViews: { select: { tabName: true } },
                  },
                },
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const viewsMap = new Map(viewsByPage.map((v) => [v.pageId, v._count.id]));
  const rooms: DealRoomDetail[] = deal.pages.map((p) => {
    const eng = perPage.get(p.id) ?? emptyPageEngagement(p.id);
    return {
      id: p.id,
      title: p.title,
      published: p.published,
      restricted: !viewableSet.has(p.id),
      views: viewsMap.get(p.id) ?? 0,
      visitorCount: eng.visitorCount,
      highIntentCount: eng.highIntentCount,
      lastActivityAt: iso(eng.lastSeenAt),
    };
  });

  // Group room contacts by lowercased email — the only identity bridge across
  // rooms (BuyerVisitor is page-scoped).
  const contactsByEmail = new Map<string, (typeof contacts)[number][]>();
  for (const c of contacts) {
    const key = c.email.trim().toLowerCase();
    const list = contactsByEmail.get(key);
    if (list) list.push(c);
    else contactsByEmail.set(key, [c]);
  }

  const stakeholders: DealStakeholderRow[] = deal.stakeholders.map((s) => {
    const matched = contactsByEmail.get(s.email) ?? [];
    let lastSeenAt: Date | null = null;
    let topScore = 0;
    let ctaClicked = false;
    let pricingViewed = false;
    let hasVisits = false;
    for (const contact of matched) {
      for (const v of contact.visitors) {
        hasVisits = true;
        if (!lastSeenAt || v.lastSeenAt > lastSeenAt) lastSeenAt = v.lastSeenAt;
        if (v.engagementScore > topScore) topScore = v.engagementScore;
        if (v.ctaClicked) ctaClicked = true;
        if (
          v.sessions.some((sess) =>
            sess.tabViews.some((t) => isPricingTabName(t.tabName))
          )
        ) {
          pricingViewed = true;
        }
      }
    }
    return {
      id: s.id,
      name: s.name,
      email: s.email,
      title: s.title,
      lastSeenAt: iso(lastSeenAt),
      intent: hasVisits
        ? getIntentLabel(topScore, ctaClicked, pricingViewed)
        : null,
    };
  });

  // Suggestions expose contact emails not yet on the deal — viewable rooms only.
  const stakeholderEmails = new Set(deal.stakeholders.map((s) => s.email));
  const suggestions: DealStakeholderSuggestion[] = [];
  for (const [email, list] of contactsByEmail) {
    if (stakeholderEmails.has(email)) continue;
    const visible = list.filter((c) => viewableSet.has(c.pageId));
    if (visible.length === 0) continue;
    const named = visible.find((c) => c.name);
    suggestions.push({
      email,
      name: named?.name ?? null,
      company: visible.find((c) => c.company)?.company ?? null,
    });
    if (suggestions.length >= 8) break;
  }

  const pageTitles = new Map(deal.pages.map((p) => [p.id, p.title]));
  const actionPlans: DealMapSummary[] = maps.map((m) => ({
    pageId: m.pageId,
    pageTitle: pageTitles.get(m.pageId) ?? "Untitled Page",
    title: m.title,
    closeDate: iso(m.closeDate),
    completedCount: m.items.filter((i) => i.completed).length,
    totalCount: m.items.length,
    items: m.items.map((i) => ({
      id: i.id,
      title: i.title,
      ownerType: i.ownerType === "buyer" ? ("buyer" as const) : ("seller" as const),
      ownerName: i.ownerName,
      dueDate: iso(i.dueDate),
      completed: i.completed,
    })),
  }));

  const rollup = rollupDealEngagement(
    deal.pages.map((p) => perPage.get(p.id) ?? emptyPageEngagement(p.id))
  );

  return {
    id: deal.id,
    name: deal.name,
    company: deal.company,
    value: deal.value,
    stage: deal.stage,
    stageEnteredAt: deal.stageEnteredAt.toISOString(),
    status: deal.status,
    expectedCloseDate: iso(deal.expectedCloseDate),
    closedAt: iso(deal.closedAt),
    owner: deal.owner,
    teamId: deal.teamId,
    rooms,
    stakeholders,
    stakeholderSuggestions: suggestions,
    actionPlans,
    comments: deal.comments.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
      author: c.author,
    })),
    engagement: {
      lastActivityAt: iso(rollup.lastActivityAt),
      intent: rollup.intent,
      topScore: rollup.topScore,
    },
    createdAt: deal.createdAt.toISOString(),
  };
}
