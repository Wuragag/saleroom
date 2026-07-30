import { prisma } from "@/lib/prisma";
import { accessiblePageWhere } from "@/lib/team-auth";
import { accessibleDealWhere } from "@/lib/deal-auth";
import { contactScopeWhere, companyScopeWhere, type CrmScope } from "@/lib/contacts";
import {
  HIGH_INTENT_VISITOR_WHERE,
  getIntentLabel,
  isPricingTabName,
} from "@/lib/engagement-score";
import {
  rollupDealEngagement,
  type DealPageEngagement,
} from "@/lib/deal-engagement";
import type { CompanyOption, CompanyRow, ContactRow } from "@/types";

// Server-only queries for the Contacts and Companies tabs. Engagement joins
// the canonical rows to tracking data by lowercased email — the same bridge
// the deal detail's stakeholder warmth uses.

const iso = (d: Date | null | undefined): string | null =>
  d ? d.toISOString() : null;

interface EmailEngagement {
  lastSeenAt: Date | null;
  topScore: number;
  ctaClicked: boolean;
  pricingViewed: boolean;
}

/** Fold PageContact→visitor aggregates by lowercased email. */
async function loadEngagementByEmail(
  userId: string,
  teamId: string | null
): Promise<Map<string, EmailEngagement>> {
  const pages = await prisma.page.findMany({
    where: accessiblePageWhere(userId, teamId),
    select: { id: true },
  });
  const byEmail = new Map<string, EmailEngagement>();
  if (pages.length === 0) return byEmail;

  const pageContacts = await prisma.pageContact.findMany({
    where: { pageId: { in: pages.map((p) => p.id) } },
    select: {
      email: true,
      visitors: {
        select: {
          lastSeenAt: true,
          engagementScore: true,
          ctaClicked: true,
          sessions: { select: { tabViews: { select: { tabName: true } } } },
        },
      },
    },
  });

  for (const pc of pageContacts) {
    const key = pc.email.trim().toLowerCase();
    const entry = byEmail.get(key) ?? {
      lastSeenAt: null,
      topScore: 0,
      ctaClicked: false,
      pricingViewed: false,
    };
    for (const v of pc.visitors) {
      if (!entry.lastSeenAt || v.lastSeenAt > entry.lastSeenAt) {
        entry.lastSeenAt = v.lastSeenAt;
      }
      if (v.engagementScore > entry.topScore) entry.topScore = v.engagementScore;
      if (v.ctaClicked) entry.ctaClicked = true;
      if (
        v.sessions.some((s) => s.tabViews.some((t) => isPricingTabName(t.tabName)))
      ) {
        entry.pricingViewed = true;
      }
    }
    byEmail.set(key, entry);
  }
  return byEmail;
}

/**
 * Just the names — what the company pickers need. Deliberately separate from
 * listCompanies, which does the engagement rollups for the Companies tab.
 */
export async function listCompanyOptions(
  userId: string,
  teamId: string | null
): Promise<CompanyOption[]> {
  return prisma.company.findMany({
    where: companyScopeWhere({ teamId, userId }),
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

/** All canonical contacts in scope, with warmth and deal counts. */
export async function listContacts(
  userId: string,
  teamId: string | null
): Promise<ContactRow[]> {
  const scope: CrmScope = { teamId, userId };
  const [contacts, engagement] = await Promise.all([
    prisma.contact.findMany({
      where: contactScopeWhere(scope),
      include: { company: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    loadEngagementByEmail(userId, teamId),
  ]);

  // Deal participation = stakeholder rows on accessible deals, by email.
  const stakeholders = contacts.length
    ? await prisma.dealStakeholder.findMany({
        where: {
          email: { in: contacts.map((c) => c.email) },
          deal: accessibleDealWhere(userId, teamId),
        },
        select: { email: true, dealId: true },
      })
    : [];
  const dealsByEmail = new Map<string, Set<string>>();
  for (const s of stakeholders) {
    const set = dealsByEmail.get(s.email) ?? new Set<string>();
    set.add(s.dealId);
    dealsByEmail.set(s.email, set);
  }

  return contacts.map((c) => {
    const eng = engagement.get(c.email);
    return {
      id: c.id,
      email: c.email,
      name: c.name,
      title: c.title,
      company: c.company,
      dealCount: dealsByEmail.get(c.email)?.size ?? 0,
      lastSeenAt: iso(eng?.lastSeenAt ?? null),
      intent: eng?.lastSeenAt
        ? getIntentLabel(eng.topScore, eng.ctaClicked, eng.pricingViewed)
        : null,
    };
  });
}

/** All companies in scope, with contact/deal counts, open value, and pulse. */
export async function listCompanies(
  userId: string,
  teamId: string | null
): Promise<CompanyRow[]> {
  const scope: CrmScope = { teamId, userId };
  const companies = await prisma.company.findMany({
    where: companyScopeWhere(scope),
    include: {
      _count: { select: { contacts: true } },
      deals: {
        select: {
          id: true,
          name: true,
          status: true,
          value: true,
          pages: { select: { id: true } },
        },
      },
      contacts: {
        select: { id: true, name: true, email: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  // One batched engagement pass over every company's deals' rooms.
  const allPageIds = companies.flatMap((c) =>
    c.deals.flatMap((d) => d.pages.map((p) => p.id))
  );
  const perPage = new Map<string, DealPageEngagement>();
  if (allPageIds.length > 0) {
    const [visitorsByPage, highIntentByPage] = await Promise.all([
      prisma.buyerVisitor.groupBy({
        by: ["pageId"],
        where: { pageId: { in: allPageIds } },
        _count: { id: true },
        _max: { lastSeenAt: true, engagementScore: true },
      }),
      prisma.buyerVisitor.groupBy({
        by: ["pageId"],
        where: { pageId: { in: allPageIds }, ...HIGH_INTENT_VISITOR_WHERE },
        _count: { id: true },
      }),
    ]);
    const highIntent = new Map(highIntentByPage.map((h) => [h.pageId, h._count.id]));
    for (const v of visitorsByPage) {
      perPage.set(v.pageId, {
        pageId: v.pageId,
        lastSeenAt: v._max.lastSeenAt,
        topScore: v._max.engagementScore ?? 0,
        visitorCount: v._count.id,
        highIntentCount: highIntent.get(v.pageId) ?? 0,
      });
    }
  }

  return companies.map((c) => {
    const openDeals = c.deals.filter((d) => d.status === "OPEN");
    const pageInputs = c.deals.flatMap((d) =>
      d.pages.map(
        (p) =>
          perPage.get(p.id) ?? {
            pageId: p.id,
            lastSeenAt: null,
            topScore: 0,
            visitorCount: 0,
            highIntentCount: 0,
          }
      )
    );
    const rollup = rollupDealEngagement(pageInputs);
    return {
      id: c.id,
      name: c.name,
      contactCount: c._count.contacts,
      contacts: c.contacts,
      deals: c.deals.map((d) => ({ id: d.id, name: d.name, status: d.status })),
      openDealCount: openDeals.length,
      openValue: openDeals.reduce((sum, d) => sum + (d.value ?? 0), 0),
      engagement: {
        lastActivityAt: iso(rollup.lastActivityAt),
        intent: rollup.intent,
        topScore: rollup.topScore,
      },
    };
  });
}
