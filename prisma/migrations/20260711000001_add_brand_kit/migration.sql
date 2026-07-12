-- Team brand kit: the brand styles new pages inherit (Settings → Branding).
CREATE TABLE "BrandKit" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#17171a',
    "secondaryColors" TEXT NOT NULL DEFAULT '[]',
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "font" TEXT NOT NULL DEFAULT 'dmsans',
    "headingFont" TEXT NOT NULL DEFAULT '',
    "background" TEXT NOT NULL DEFAULT 'white',
    "themeRadius" TEXT NOT NULL DEFAULT 'default',
    "themeDepth" TEXT NOT NULL DEFAULT 'default',
    "hideBranding" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandKit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BrandKit_teamId_key" ON "BrandKit"("teamId");

ALTER TABLE "BrandKit" ADD CONSTRAINT "BrandKit_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
