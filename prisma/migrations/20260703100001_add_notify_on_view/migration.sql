-- Opt-in email notification when a new visitor starts a session on a page
ALTER TABLE "Page" ADD COLUMN "notifyOnView" BOOLEAN NOT NULL DEFAULT false;
