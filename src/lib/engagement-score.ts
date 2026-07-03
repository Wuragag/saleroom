/**
 * Engagement score computation — pure function, no DB access.
 *
 * Max possible score: ~100 (intentionally capped via intent labels).
 *
 * Weights:
 *  Page visit (session started)  +10
 *  Per unique tab viewed          +5 (up to 4 tabs = max +20)
 *  Pricing tab viewed            +15  (replaces the flat +5 for that tab)
 *  CTA clicked                   +20
 *  File downloaded               +20
 *  Return visit                  +10
 *  Session ≥ 3 minutes           +10
 *  Multiple sessions (≥2)        +15
 */

export interface SessionScoreInput {
  uniqueTabsViewed: number;
  pricingTabViewed: boolean;
  ctaClicked: boolean;
  fileDownloaded: boolean;
  isReturn: boolean;
  durationSeconds: number;
  totalSessions: number; // total sessions for this visitor (including this one)
}

export function computeSessionScore(input: SessionScoreInput): number {
  let score = 0;

  // Base: arrived on page
  score += 10;

  // Tab views (pricing tab gets bonus instead of flat +5)
  const nonPricingTabs = input.pricingTabViewed
    ? Math.max(0, input.uniqueTabsViewed - 1)
    : input.uniqueTabsViewed;

  score += Math.min(nonPricingTabs, 4) * 5;
  if (input.pricingTabViewed) score += 15;

  // Actions
  if (input.ctaClicked) score += 20;
  if (input.fileDownloaded) score += 20;

  // Loyalty / depth
  if (input.isReturn) score += 10;
  if (input.durationSeconds >= 180) score += 10;
  if (input.totalSessions >= 2) score += 15;

  return Math.min(score, 100);
}

/** Aggregate visitor-level score from all their sessions */
export function aggregateVisitorScore(sessionScores: number[]): number {
  if (sessionScores.length === 0) return 0;
  // Use the highest single-session score + a small bonus per extra session
  const max = Math.max(...sessionScores);
  const bonus = Math.min((sessionScores.length - 1) * 5, 15);
  return Math.min(max + bonus, 100);
}

/**
 * Single source of truth for "is this tab the pricing tab?" — used by the
 * client tracker, the buyer analytics endpoint, and the contacts endpoint.
 */
export function isPricingTabName(name: string): boolean {
  return name.toLowerCase().includes("pric");
}

export type IntentLabel = "High Intent" | "Warm" | "Cold";

export function getIntentLabel(score: number, ctaClicked: boolean, pricingTabViewed: boolean): IntentLabel {
  if (ctaClicked || pricingTabViewed || score >= 70) return "High Intent";
  if (score >= 30) return "Warm";
  return "Cold";
}
