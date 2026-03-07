-- CreateTable
CREATE TABLE "SyncedBlock" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}',
    "teamId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncedBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SyncedBlock_teamId_idx" ON "SyncedBlock"("teamId");

-- AddForeignKey
ALTER TABLE "SyncedBlock" ADD CONSTRAINT "SyncedBlock_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncedBlock" ADD CONSTRAINT "SyncedBlock_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
