-- Opt-in session replay: recording toggle + chunked recording storage
ALTER TABLE "Page" ADD COLUMN "recordingEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "SessionRecording" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "eventCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionRecording_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SessionRecording_sessionId_chunkIndex_key" ON "SessionRecording"("sessionId", "chunkIndex");
CREATE INDEX "SessionRecording_sessionId_idx" ON "SessionRecording"("sessionId");

ALTER TABLE "SessionRecording" ADD CONSTRAINT "SessionRecording_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "BuyerSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
