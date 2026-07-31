-- Add hero layout variant to pages (left | centered | compact)
ALTER TABLE "Page" ADD COLUMN "heroLayout" TEXT NOT NULL DEFAULT 'left';
