-- Custom pipeline stages + deal comments.
-- Converts Deal.stage (enum) into Deal.stageId (FK to per-scope PipelineStage
-- rows), seeding the four former enum stages for every scope that already has
-- deals and mapping each deal onto its seeded row. Scopes without deals get
-- their default stages lazily at runtime (ensurePipelineStages).

-- CreateTable
CREATE TABLE "PipelineStage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "teamId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PipelineStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealComment" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PipelineStage_teamId_order_idx" ON "PipelineStage"("teamId", "order");

-- CreateIndex
CREATE INDEX "PipelineStage_userId_order_idx" ON "PipelineStage"("userId", "order");

-- CreateIndex
CREATE INDEX "DealComment_dealId_createdAt_idx" ON "DealComment"("dealId", "createdAt");

-- AddForeignKey
ALTER TABLE "PipelineStage" ADD CONSTRAINT "PipelineStage_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineStage" ADD CONSTRAINT "PipelineStage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealComment" ADD CONSTRAINT "DealComment_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealComment" ADD CONSTRAINT "DealComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed the former enum stages for every team that already has deals
INSERT INTO "PipelineStage" ("id", "name", "order", "teamId")
SELECT gen_random_uuid()::text, s."name", s."ord", t."teamId"
FROM (SELECT DISTINCT "teamId" FROM "Deal" WHERE "teamId" IS NOT NULL) t
CROSS JOIN (VALUES ('New', 0), ('Qualified', 1), ('Proposal', 2), ('Negotiation', 3)) AS s("name", "ord");

-- ...and for every teamless deal owner
INSERT INTO "PipelineStage" ("id", "name", "order", "userId")
SELECT gen_random_uuid()::text, s."name", s."ord", u."ownerId"
FROM (SELECT DISTINCT "ownerId" FROM "Deal" WHERE "teamId" IS NULL) u
CROSS JOIN (VALUES ('New', 0), ('Qualified', 1), ('Proposal', 2), ('Negotiation', 3)) AS s("name", "ord");

-- Move Deal.stage (enum) onto the seeded rows
ALTER TABLE "Deal" ADD COLUMN "stageId" TEXT;
ALTER TABLE "Deal" ADD COLUMN "stageEnteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Deal" d
SET "stageId" = ps."id"
FROM "PipelineStage" ps
WHERE ps."name" = CASE d."stage"::text
      WHEN 'NEW' THEN 'New'
      WHEN 'QUALIFIED' THEN 'Qualified'
      WHEN 'PROPOSAL' THEN 'Proposal'
      WHEN 'NEGOTIATION' THEN 'Negotiation'
    END
  AND (
    (d."teamId" IS NOT NULL AND ps."teamId" = d."teamId")
    OR (d."teamId" IS NULL AND ps."userId" = d."ownerId")
  );

ALTER TABLE "Deal" ALTER COLUMN "stageId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "PipelineStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Deal_stageId_idx" ON "Deal"("stageId");

-- Drop the old enum column and type
ALTER TABLE "Deal" DROP COLUMN "stage";
DROP TYPE "DealStage";
