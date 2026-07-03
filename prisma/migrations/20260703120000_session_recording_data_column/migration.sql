-- Session replay chunks are stored in Postgres, not Blob storage: this
-- project's Vercel Blob store is provisioned public-only, and recording
-- data (buyer DOM/mouse activity) should carry the same authenticated-read
-- privacy model as the rest of the buyer analytics data, not be reachable
-- via a bare URL. Table was just added this session and has zero rows.
ALTER TABLE "SessionRecording" ADD COLUMN "data" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SessionRecording" ALTER COLUMN "data" DROP DEFAULT;
ALTER TABLE "SessionRecording" DROP COLUMN "blobUrl";
