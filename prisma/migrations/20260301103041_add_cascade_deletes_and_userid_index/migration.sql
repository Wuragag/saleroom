-- DropForeignKey
ALTER TABLE "Page" DROP CONSTRAINT "Page_userId_fkey";

-- DropForeignKey
ALTER TABLE "TeamInvite" DROP CONSTRAINT "TeamInvite_invitedById_fkey";

-- CreateIndex
CREATE INDEX "Page_userId_idx" ON "Page"("userId");

-- AddForeignKey
ALTER TABLE "TeamInvite" ADD CONSTRAINT "TeamInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
