-- Pitch-grade page theming: heading font pairing, hero eyebrow/subtitle,
-- cover layout/height, and radius/depth "vibe" controls. All defaults
-- reproduce the pre-migration look, so existing pages render unchanged.
ALTER TABLE "Page" ADD COLUMN "headingFont" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Page" ADD COLUMN "coverLayout" TEXT NOT NULL DEFAULT 'standard';
ALTER TABLE "Page" ADD COLUMN "coverHeight" TEXT NOT NULL DEFAULT 'default';
ALTER TABLE "Page" ADD COLUMN "eyebrow" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Page" ADD COLUMN "subtitle" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Page" ADD COLUMN "themeRadius" TEXT NOT NULL DEFAULT 'default';
ALTER TABLE "Page" ADD COLUMN "themeDepth" TEXT NOT NULL DEFAULT 'default';
