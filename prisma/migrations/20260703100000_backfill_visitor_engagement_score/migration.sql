-- Data-only backfill: BuyerVisitor.engagementScore was written once (0) at
-- creation and never updated, so every score-based High Intent count read 0.
-- Recompute from existing session scores: max session score + 5 per extra
-- session (bonus capped at 15), total capped at 100.
UPDATE "BuyerVisitor" v
SET "engagementScore" = LEAST(
  100,
  s.max_score + LEAST(GREATEST(v."totalSessions" - 1, 0) * 5, 15)
)
FROM (
  SELECT "visitorId", MAX("engagementScore") AS max_score
  FROM "BuyerSession"
  GROUP BY "visitorId"
) s
WHERE s."visitorId" = v."id"
  AND v."engagementScore" < s.max_score + LEAST(GREATEST(v."totalSessions" - 1, 0) * 5, 15);
