/**
 * Deal-level engagement rollup — pure function, no DB access.
 *
 * Folds per-room buyer aggregates (from the stored BuyerVisitor columns) into
 * one "deal pulse": when was the buyer last active anywhere on this deal, and
 * how warm are they. Reuses the existing intent taxonomy from
 * engagement-score.ts — no new scoring system.
 *
 * Deliberately no deal-level visitor counts: the same human is a separate
 * BuyerVisitor row on every room (unique per [visitorHash, pageId]), so a
 * cross-room count would double-count people.
 */

import { getIntentLabel, type IntentLabel } from "@/lib/engagement-score";

/** Per-linked-room aggregates, straight from grouped BuyerVisitor queries. */
export interface DealPageEngagement {
  pageId: string;
  /** max BuyerVisitor.lastSeenAt for the page; null when it has no visitors */
  lastSeenAt: Date | null;
  /** max stored BuyerVisitor.engagementScore for the page */
  topScore: number;
  /** BuyerVisitor rows on the page */
  visitorCount: number;
  /** BuyerVisitor rows matching HIGH_INTENT_VISITOR_WHERE */
  highIntentCount: number;
}

export interface DealEngagementRollup {
  /** Most recent buyer activity across every linked room; null = none yet */
  lastActivityAt: Date | null;
  /** Warmth via the shared IntentLabel; null = no buyer activity yet */
  intent: IntentLabel | null;
  /** Best stored visitor score across linked rooms */
  topScore: number;
}

export function rollupDealEngagement(
  pages: DealPageEngagement[]
): DealEngagementRollup {
  let lastActivityAt: Date | null = null;
  let topScore = 0;
  let visitorCount = 0;
  let highIntentCount = 0;

  for (const page of pages) {
    if (page.lastSeenAt && (!lastActivityAt || page.lastSeenAt > lastActivityAt)) {
      lastActivityAt = page.lastSeenAt;
    }
    if (page.topScore > topScore) topScore = page.topScore;
    visitorCount += page.visitorCount;
    highIntentCount += page.highIntentCount;
  }

  if (visitorCount === 0) {
    return { lastActivityAt: null, intent: null, topScore: 0 };
  }

  // highIntentCount mirrors HIGH_INTENT_VISITOR_WHERE (CTA click, pricing-tab
  // view, or 70+ stored score) — the DB-side version of getIntentLabel's
  // override inputs, which the grouped query can't surface per-visitor.
  const intent: IntentLabel =
    highIntentCount > 0 ? "High Intent" : getIntentLabel(topScore, false, false);

  return { lastActivityAt, intent, topScore };
}
