-- CreateTable
CREATE TABLE "TeamAiCredits" (
    "id" TEXT NOT NULL,
    "teamId" TEXT,
    "userId" TEXT,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "periodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamAiCredits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamAiCredits_teamId_key" ON "TeamAiCredits"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamAiCredits_userId_key" ON "TeamAiCredits"("userId");

-- AddForeignKey
ALTER TABLE "TeamAiCredits" ADD CONSTRAINT "TeamAiCredits_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
