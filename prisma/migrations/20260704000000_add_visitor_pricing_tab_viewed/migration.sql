-- Persist whether a visitor ever viewed a pricing tab. Previously this signal
-- lived only in per-session tab-view rows, so the main dashboard's High Intent
-- count (which reads stored BuyerVisitor columns) and the per-page buyer panel
-- (which recomputed intent from loaded sessions and factored in pricing) used
-- two different definitions. Storing it lets both share one definition:
-- High Intent = ctaClicked OR pricingTabViewed OR engagementScore >= 70.
ALTER TABLE "BuyerVisitor" ADD COLUMN "pricingTabViewed" BOOLEAN NOT NULL DEFAULT false;

-- Backfill from existing tab-view history: a pricing tab is any tab whose name
-- contains "pric" (case-insensitive), matching isPricingTabName().
UPDATE "BuyerVisitor" v
SET "pricingTabViewed" = true
FROM "BuyerSession" s
JOIN "BuyerTabView" tv ON tv."sessionId" = s."id"
WHERE s."visitorId" = v."id"
  AND lower(tv."tabName") LIKE '%pric%';
