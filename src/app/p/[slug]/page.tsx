import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import crypto from "crypto";
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
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { PublishedFormHydrator } from "@/components/published-form";
import { BuyerAnalyticsTracker } from "@/components/buyer-analytics-tracker";
import { MapViewer } from "@/components/map-viewer";
import { resolveSyncedBlocks } from "@/lib/resolve-synced-blocks";
import { getTeamBrandKit } from "@/lib/brand-kit";
import { getTeamPlan, PLAN_LIMITS } from "@/lib/plan-limits";

// ISR: serve cached pages, revalidate in background every 60s.
// Analytics tracking moved client-side so this page can be cached.
export const revalidate = 60;

export default async function PublishedPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ name?: string; company?: string; ref?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const page = await prisma.page.findFirst({
    where: { slug, published: true },
    include: { tabs: { orderBy: { order: "asc" } } },
  });

  if (!page) notFound();

  // ── Ref token tracking ──
  // A `?ref=` request never reaches this component: middleware redirects it
  // to /api/ref first (see src/middleware.ts), which validates the token,
  // sets the tracking cookie, and redirects back here without the query
  // param. That's more reliable than redirecting from inside this ISR-cached
  // page — a searchParams-conditional redirect() here didn't consistently
  // take effect once `revalidate` was in play.

  // Read existing ref cookie (set by /api/ref on a prior visit). Fall back to
  // the legacy `sr_` cookie name (pre-Dealbeam rebrand) so in-flight refs survive.
  const cookieStore = await cookies();
  const refToken: string | null =
    cookieStore.get(`db_ref_${page.id}`)?.value ??
    cookieStore.get(`sr_ref_${page.id}`)?.value ??
    null;

  // ── Email gate ──
  if (page.requireEmail && !refToken) {
    // No valid ref → show email gate
    const { EmailGate } = await import("@/components/email-gate");
    return <EmailGate pageId={page.id} slug={page.slug} />;
  }

  // Password gate — HMAC with server secret so DB leak alone can't forge tokens
  if (page.password) {
    const token = cookieStore.get(`page_auth_${page.id}`)?.value;
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) throw new Error("AUTH_SECRET or NEXTAUTH_SECRET must be set");
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${page.id}:${page.password}`)
      .digest("hex");
    if (token !== expected) {
      redirect(`/p/${page.slug}/password`);
    }
  }

  const tabs = await Promise.all(
    page.tabs.map(async (tab) => {
      const parsed = JSON.parse(tab.content);
      const resolved = await resolveSyncedBlocks(parsed, page.teamId);
      return { id: tab.id, name: tab.name, content: resolved };
    })
  );

  const bgHex = getBgHex(page.background);
  const fontStyle = getFontStyle(page.font);
  const accentColor = getAccentColor(page.accentColor);
  const isDark = isDarkBackground(page.background);
  const links = (() => { try { return JSON.parse(page.links ?? "[]"); } catch { return []; } })();

  // Respect the page's layout width setting
  const maxWidth = getMaxWidth(page.layoutWidth);

  // Personalization params — sanitize to prevent social-engineering phishing
  // (React auto-escapes HTML, but we still limit length and strip suspicious content)
  const sanitizeParam = (val: string | undefined, maxLen: number): string | null => {
    if (!val) return null;
    const cleaned = val.trim().slice(0, maxLen).replace(/[<>]/g, "");
    return cleaned || null;
  };
  const personName = sanitizeParam(resolvedSearchParams.name, 60);
  const personCompany = sanitizeParam(resolvedSearchParams.company, 80);

  // Theme CSS variables — consumed by .pub-content CSS in globals.css
  const cssVars = getPubCssVars({
    accentColor,
    background: page.background,
    font: page.font,
    headingFont: page.headingFont,
    themeRadius: page.themeRadius,
    themeDepth: page.themeDepth,
  });

  // White-label: hide the "Powered by" badge when the team's brand kit asks
  // for it AND the plan allows it (server-enforced, so a downgrade re-shows
  // the badge within the ISR window).
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

  return (
    <PageShell
      bgHex={bgHex}
      fontStyle={fontStyle}
      cssVars={cssVars}
      accentColor={accentColor}
      isDark={isDark}
      maxWidth={maxWidth}
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
      header={
        personName ? (
          <header
            className="pub-header relative z-20 w-full"
            style={{
              borderBottom: "1px solid var(--pub-header-border)",
              background: isDark ? "rgba(10,10,15,0.55)" : "rgba(255,255,255,0.65)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
            }}
          >
            <div
              className="mx-auto px-6 h-11 flex items-center justify-end"
              style={{ maxWidth }}
            >
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{
                  fontFamily: "var(--font-syne, var(--font-montserrat), sans-serif)",
                  background: `${accentColor}1a`,
                  color: accentColor,
                  border: `1px solid ${accentColor}38`,
                }}
              >
                Made for {personName}{personCompany ? ` · ${personCompany}` : ""}
              </span>
            </div>
          </header>
        ) : undefined
      }
      intro={
        personName ? (
          <div
            className="mb-14"
            style={{ paddingBottom: "48px", borderBottom: "1px solid var(--pub-divider)" }}
          >
            <p
              className="pub-title"
              style={{
                fontFamily: "var(--pub-font-body, inherit)",
                fontSize: "clamp(1.875rem, 4.5vw, 2.75rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                color: "var(--pub-heading-color)",
                margin: "0 0 0.625rem",
              }}
            >
              Hi {personName} 👋
            </p>
            <p
              style={{
                color: "var(--pub-body-color)",
                fontSize: "1.0625rem",
                margin: 0,
                lineHeight: 1.75,
              }}
            >
              This page was put together just for you.
            </p>
          </div>
        ) : undefined
      }
      logo={overlayHero ? undefined : heroLogo}
      eyebrow={overlayHero ? undefined : heroEyebrow}
      title={overlayHero ? undefined : heroTitle}
      subtitle={overlayHero ? undefined : heroSubtitle}
      trailing={
        <>
          <AnalyticsTracker pageId={page.id} />
          <BuyerAnalyticsTracker
            pageId={page.id}
            initialTabId={tabs[0]?.id}
            initialTabName={tabs[0]?.name}
            refToken={refToken ?? undefined}
            recordingEnabled={page.recordingEnabled}
          />
          <PublishedFormHydrator pageId={page.id} accentColor={accentColor} />
        </>
      }
    >
      {/* Tabs + content */}
      <TabbedPageView
        tabs={tabs}
        links={links}
        accentColor={accentColor}
        tabPlacement={page.tabPlacement as "top" | "left"}
        isDark={isDark}
      />

      {/* Mutual Action Plan */}
      <MapViewer slug={slug} accentColor={accentColor} isDark={isDark} />
    </PageShell>
  );
}
