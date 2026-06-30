-- Scope templates to a team (NULL teamId == global/default template).
ALTER TABLE "Template" ADD COLUMN "teamId" TEXT;
CREATE INDEX "Template_teamId_idx" ON "Template"("teamId");
ALTER TABLE "Template" ADD CONSTRAINT "Template_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Single-use impersonation tokens (prevents replay of a still-valid signed token).
CREATE TABLE "UsedImpersonationToken" (
    "nonce" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UsedImpersonationToken_pkey" PRIMARY KEY ("nonce")
);
CREATE INDEX "UsedImpersonationToken_expiresAt_idx" ON "UsedImpersonationToken"("expiresAt");
