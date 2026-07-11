import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import Image from "next/image";
import { TabbedPageView } from "@/components/tabbed-page-view";
import { getBgHex, getFontStyle, getAccentColor } from "@/lib/page-styles";
import { getPubCssVars, getMaxWidth, isDarkBackground } from "@/lib/pub-theme";
import {
  PageShell,
  PUB_TITLE_STYLE,
  PUB_LOGO_STYLE,
  PUB_EYEBROW_STYLE,
  PUB_SUBTITLE_STYLE,
} from "@/components/page-shell";
import {
  PubCover,
  PUB_OVERLAY_TEXT_STYLE,
  PUB_OVERLAY_SUBTITLE_STYLE,
  PUB_OVERLAY_EYEBROW_STYLE,
} from "@/components/pub-cover";
import { PublishedFormHydrator } from "@/components/published-form";
import { getTeamBrandKit } from "@/lib/brand-kit";
import { getTeamPlan, PLAN_LIMITS } from "@/lib/plan-limits";
import Link from "next/link";
import { Pencil } from "lucide-react";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  // Fetch by ID — no published filter so drafts work too
  const page = await prisma.page.findUnique({
    where: { id },
    include: { tabs: { orderBy: { order: "asc" } } },
  });

  if (!page) notFound();
  if (page.userId !== session.user.id) notFound();

  const tabs = page.tabs.map((tab) => ({
    id: tab.id,
    name: tab.name,
    content: JSON.parse(tab.content),
  }));

  const bgHex = getBgHex(page.background);
  const fontStyle = getFontStyle(page.font);
  const accentColor = getAccentColor(page.accentColor);
  const isDark = isDarkBackground(page.background);
  const links = (() => {
    try {
      return JSON.parse(page.links ?? "[]");
    } catch {
      return [];
    }
  })();

  const maxWidth = getMaxWidth(page.layoutWidth);
  const cssVars = getPubCssVars({
    accentColor,
    background: page.background,
    font: page.font,
    headingFont: page.headingFont,
    themeRadius: page.themeRadius,
    themeDepth: page.themeDepth,
  });

  // Mirror the published page's white-label state so the preview is faithful
  let showBranding = true;
  if (page.teamId) {
    const [kit, plan] = await Promise.all([
      getTeamBrandKit(page.teamId),
      getTeamPlan(page.teamId),
    ]);
    showBranding = !(kit?.hideBranding && PLAN_LIMITS[plan].hideBranding);
  }

  // Hero elements — rendered on the cover in overlay layout, in the column otherwise
  const overlayHero = Boolean(page.coverImage) && page.coverLayout === "overlay";
  const heroLogo = page.logoUrl ? (
    <Image src={page.logoUrl} alt="Logo" width={180} height={36} style={PUB_LOGO_STYLE} />
  ) : undefined;
  const heroEyebrow = page.eyebrow ? (
    <span style={{ ...PUB_EYEBROW_STYLE, ...(overlayHero ? PUB_OVERLAY_EYEBROW_STYLE : {}) }}>
      {page.eyebrow}
    </span>
  ) : undefined;
  const heroTitle = (
    <h1
      className="pub-title"
      style={{ ...PUB_TITLE_STYLE, ...(overlayHero ? PUB_OVERLAY_TEXT_STYLE : {}) }}
    >
      {page.title}
    </h1>
  );
  const heroSubtitle = page.subtitle ? (
    <p style={{ ...PUB_SUBTITLE_STYLE, ...(overlayHero ? PUB_OVERLAY_SUBTITLE_STYLE : {}) }}>
      {page.subtitle}
    </p>
  ) : undefined;

  const previewBanner = (
    <div
      className="sticky top-0 z-50 w-full flex items-center justify-between px-5 py-2.5 text-xs font-medium"
      style={{
        background: isDark ? "rgba(30,20,0,0.92)" : "rgba(255,248,220,0.97)",
        borderBottom: "1px solid rgba(234,179,8,0.35)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        color: isDark ? "#fbbf24" : "#92400e",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "1.25rem",
          height: "1.25rem",
          borderRadius: "9999px",
          background: isDark ? "rgba(251,191,36,0.2)" : "rgba(234,179,8,0.2)",
          fontSize: "0.625rem",
          fontWeight: 700,
        }}>
          ◉
        </span>
        Preview mode — changes are saved automatically but this page is{" "}
        {page.published ? "published" : "not yet published"}.
      </span>
      <Link
        href={`/editor/${page.id}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.375rem",
          padding: "0.25rem 0.75rem",
          borderRadius: "6px",
          background: isDark ? "rgba(251,191,36,0.15)" : "rgba(234,179,8,0.18)",
          border: `1px solid ${isDark ? "rgba(251,191,36,0.3)" : "rgba(234,179,8,0.4)"}`,
          color: isDark ? "#fbbf24" : "#92400e",
          fontWeight: 600,
          textDecoration: "none",
          fontSize: "0.75rem",
        }}
      >
        <Pencil style={{ width: "0.75rem", height: "0.75rem" }} />
        Back to editor
      </Link>
    </div>
  );

  return (
    <PageShell
      bgHex={bgHex}
      fontStyle={fontStyle}
      cssVars={cssVars}
      accentColor={accentColor}
      isDark={isDark}
      maxWidth={maxWidth}
      banner={previewBanner}
      showBranding={showBranding}
      paddingTop={page.coverImage ? (overlayHero ? "56px" : "40px") : "72px"}
      coverImage={
        page.coverImage ? (
          <PubCover
            src={page.coverImage}
            coverHeight={page.coverHeight}
            coverLayout={page.coverLayout}
            maxWidth={maxWidth}
            overlayContent={
              overlayHero ? (
                <>
                  {heroLogo}
                  {heroEyebrow}
                  {heroTitle}
                  {heroSubtitle}
                </>
              ) : undefined
            }
          />
        ) : undefined
      }
      logo={overlayHero ? undefined : heroLogo}
      eyebrow={overlayHero ? undefined : heroEyebrow}
      title={overlayHero ? undefined : heroTitle}
      subtitle={overlayHero ? undefined : heroSubtitle}
      trailing={<PublishedFormHydrator pageId={page.id} accentColor={accentColor} />}
    >
      <TabbedPageView
        tabs={tabs}
        links={links}
        accentColor={accentColor}
        tabPlacement={page.tabPlacement as "top" | "left"}
        isDark={isDark}
      />
    </PageShell>
  );
}
