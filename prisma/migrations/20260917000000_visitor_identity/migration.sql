-- Visitor identity: split "whose link brought you" (referrer) from "who you
-- are" (identity), add magic-link verification and domain allow-listing.

-- Enums
CREATE TYPE "IdentitySource" AS ENUM ('LINK', 'GATE', 'VERIFIED');
CREATE TYPE "ContactSource" AS ENUM ('SHARE', 'GATE');

-- Page: email-gate modifiers
ALTER TABLE "Page" ADD COLUMN "verifyEmail" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Page" ADD COLUMN "allowedDomains" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- PageContact: provenance + verification
ALTER TABLE "PageContact" ADD COLUMN "source" "ContactSource" NOT NULL DEFAULT 'SHARE';
ALTER TABLE "PageContact" ADD COLUMN "verifiedAt" TIMESTAMP(3);

-- BuyerVisitor: identity source + referrer
ALTER TABLE "BuyerVisitor" ADD COLUMN "identitySource" "IdentitySource";
ALTER TABLE "BuyerVisitor" ADD COLUMN "referredByContactId" TEXT;

-- Existing linked visitors are left with identitySource/referredBy NULL:
-- the old flow couldn't tell a personal-link claim from an email typed at
-- the gate, so stamping either would misrepresent legacy rows (the UI shows
-- them as plainly "Linked").

CREATE INDEX "BuyerVisitor_referredByContactId_idx" ON "BuyerVisitor"("referredByContactId");

ALTER TABLE "BuyerVisitor"
  ADD CONSTRAINT "BuyerVisitor_referredByContactId_fkey"
  FOREIGN KEY ("referredByContactId") REFERENCES "PageContact"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
