-- CreateTable
CREATE TABLE "BuyerVisitor" (
    "id" TEXT NOT NULL,
    "visitorHash" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "engagementScore" INTEGER NOT NULL DEFAULT 0,
    "ctaClicked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BuyerVisitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerSession" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "engagementScore" INTEGER NOT NULL DEFAULT 0,
    "isReturn" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BuyerSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerTabView" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "tabId" TEXT NOT NULL,
    "tabName" TEXT NOT NULL DEFAULT '',
    "viewCount" INTEGER NOT NULL DEFAULT 1,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyerTabView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyerEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BuyerVisitor_pageId_idx" ON "BuyerVisitor"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "BuyerVisitor_visitorHash_pageId_key" ON "BuyerVisitor"("visitorHash", "pageId");

-- CreateIndex
CREATE INDEX "BuyerSession_visitorId_idx" ON "BuyerSession"("visitorId");

-- CreateIndex
CREATE INDEX "BuyerSession_pageId_idx" ON "BuyerSession"("pageId");

-- CreateIndex
CREATE INDEX "BuyerSession_lastActiveAt_idx" ON "BuyerSession"("lastActiveAt");

-- CreateIndex
CREATE INDEX "BuyerTabView_sessionId_idx" ON "BuyerTabView"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "BuyerTabView_sessionId_tabId_key" ON "BuyerTabView"("sessionId", "tabId");

-- CreateIndex
CREATE INDEX "BuyerEvent_sessionId_type_idx" ON "BuyerEvent"("sessionId", "type");

-- AddForeignKey
ALTER TABLE "BuyerVisitor" ADD CONSTRAINT "BuyerVisitor_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerSession" ADD CONSTRAINT "BuyerSession_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "BuyerVisitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerTabView" ADD CONSTRAINT "BuyerTabView_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "BuyerSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerEvent" ADD CONSTRAINT "BuyerEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "BuyerSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
