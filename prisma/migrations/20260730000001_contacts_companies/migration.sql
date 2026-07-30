-- Canonical Contacts & Companies.
-- Companies are seeded from existing Deal.company strings (then the string
-- column is replaced by Deal.companyId). Contacts are seeded from
-- DealStakeholder rows (name/title win) plus PageContact rows (share links /
-- email gates), deduped by lowercased email per scope. Tracking tables are
-- untouched.

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "teamId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL DEFAULT '',
    "companyId" TEXT,
    "teamId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_teamId_name_key" ON "Company"("teamId", "name");
CREATE UNIQUE INDEX "Company_userId_name_key" ON "Company"("userId", "name");
CREATE UNIQUE INDEX "Contact_teamId_email_key" ON "Contact"("teamId", "email");
CREATE UNIQUE INDEX "Contact_userId_email_key" ON "Contact"("userId", "email");
CREATE INDEX "Contact_companyId_idx" ON "Contact"("companyId");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Company" ADD CONSTRAINT "Company_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed companies from existing deal strings
INSERT INTO "Company" ("id", "name", "teamId", "updatedAt")
SELECT gen_random_uuid()::text, d.company, d."teamId", CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "teamId", company FROM "Deal" WHERE "teamId" IS NOT NULL AND company <> '') d;

INSERT INTO "Company" ("id", "name", "userId", "updatedAt")
SELECT gen_random_uuid()::text, d.company, d."ownerId", CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "ownerId", company FROM "Deal" WHERE "teamId" IS NULL AND company <> '') d;

-- Deal.company (string) → Deal.companyId (FK)
ALTER TABLE "Deal" ADD COLUMN "companyId" TEXT;

UPDATE "Deal" d
SET "companyId" = c."id"
FROM "Company" c
WHERE c."name" = d.company
  AND (
    (d."teamId" IS NOT NULL AND c."teamId" = d."teamId")
    OR (d."teamId" IS NULL AND c."userId" = d."ownerId")
  );

ALTER TABLE "Deal" ADD CONSTRAINT "Deal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Deal_companyId_idx" ON "Deal"("companyId");
ALTER TABLE "Deal" DROP COLUMN "company";

-- Seed contacts from deal stakeholders (name/title win over page contacts)
INSERT INTO "Contact" ("id", "email", "name", "title", "teamId", "updatedAt")
SELECT gen_random_uuid()::text, lower(s.email), MAX(s.name), MAX(s.title), d."teamId", CURRENT_TIMESTAMP
FROM "DealStakeholder" s
JOIN "Deal" d ON d."id" = s."dealId"
WHERE d."teamId" IS NOT NULL
GROUP BY d."teamId", lower(s.email);

INSERT INTO "Contact" ("id", "email", "name", "title", "userId", "updatedAt")
SELECT gen_random_uuid()::text, lower(s.email), MAX(s.name), MAX(s.title), d."ownerId", CURRENT_TIMESTAMP
FROM "DealStakeholder" s
JOIN "Deal" d ON d."id" = s."dealId"
WHERE d."teamId" IS NULL
GROUP BY d."ownerId", lower(s.email);

-- ...then from room share/gate contacts, where no contact exists yet
INSERT INTO "Contact" ("id", "email", "name", "teamId", "updatedAt")
SELECT gen_random_uuid()::text, lower(pc.email), COALESCE(MAX(pc.name), ''), p."teamId", CURRENT_TIMESTAMP
FROM "PageContact" pc
JOIN "Page" p ON p."id" = pc."pageId"
WHERE p."teamId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "Contact" c
    WHERE c."teamId" = p."teamId" AND c."email" = lower(pc.email)
  )
GROUP BY p."teamId", lower(pc.email);

INSERT INTO "Contact" ("id", "email", "name", "userId", "updatedAt")
SELECT gen_random_uuid()::text, lower(pc.email), COALESCE(MAX(pc.name), ''), p."userId", CURRENT_TIMESTAMP
FROM "PageContact" pc
JOIN "Page" p ON p."id" = pc."pageId"
WHERE p."teamId" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "Contact" c
    WHERE c."userId" = p."userId" AND c."email" = lower(pc.email)
  )
GROUP BY p."userId", lower(pc.email);

-- Link contacts to a company via any stakeholder row on a company-linked deal
UPDATE "Contact" c
SET "companyId" = (
  SELECT d."companyId"
  FROM "DealStakeholder" s
  JOIN "Deal" d ON d."id" = s."dealId"
  WHERE lower(s.email) = c."email"
    AND d."companyId" IS NOT NULL
    AND (
      (c."teamId" IS NOT NULL AND d."teamId" = c."teamId")
      OR (c."userId" IS NOT NULL AND d."teamId" IS NULL AND d."ownerId" = c."userId")
    )
  LIMIT 1
)
WHERE c."companyId" IS NULL;
