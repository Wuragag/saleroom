import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import crypto from "crypto";
import Image from "next/image";
import { TabbedPageView } from "@/components/tabbed-page-view";
import { getBgHex, getFontStyle, getAccentColor } from "@/lib/page-styles";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { PublishedFormHydrator } from "@/components/published-form";
import { BuyerAnalyticsTracker } from "@/components/buyer-analytics-tracker";
import { MapViewer } from "@/components/map-viewer";
import { resolveSyncedBlocks } from "@/lib/resolve-synced-blocks";

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
  // If ?ref= is present, redirect through /api/ref to set the cookie
  // (Server Components cannot set cookies — only Route Handlers can).
  const rawRef = resolvedSearchParams.ref ?? null;
  if (rawRef) {
    const target = new URL("/api/ref", process.env.NEXTAUTH_URL ?? "http://localhost:3000");
    target.searchParams.set("token", rawRef);
    target.searchParams.set("slug", slug);
    if (resolvedSearchParams.name) target.searchParams.set("name", resolvedSearchParams.name);
    if (resolvedSearchParams.company) target.searchParams.set("company", resolvedSearchParams.company);
    redirect(target.toString());
  }

  // Read existing ref cookie (set by /api/ref on a prior visit)
  const cookieStore = await cookies();
  const refToken: string | null = cookieStore.get(`sr_ref_${page.id}`)?.value ?? null;

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
  const isDark = page.background === "dark";
  const links = (() => { try { return JSON.parse(page.links ?? "[]"); } catch { return []; } })();

  // Respect the page's layout width setting
  const maxWidths: Record<string, string> = {
    narrow: "580px",
    default: "720px",
    wide: "940px",
  };
  const maxWidth = maxWidths[page.layoutWidth ?? "default"] ?? "720px";

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
  const cssVars = {
    "--pub-accent":           accentColor,
    "--pub-heading-color":    isDark ? "#f0efe9" : "#0f172a",
    "--pub-subheading-color": isDark ? "#c8c8d8" : "#334155",
    "--pub-body-color":       isDark ? "#a8a8b3" : "#475569",
    "--pub-surface":          isDark ? "rgba(255,255,255,0.055)" : "rgba(0,0,0,0.038)",
    "--pub-divider":          isDark ? "rgba(255,255,255,0.075)" : "rgba(0,0,0,0.075)",
    "--pub-tab-bg":           isDark ? "rgba(10,10,15,0.88)" : "rgba(255,255,255,0.92)",
    "--pub-table-header-bg":  isDark ? "#13131a" : "#f1f5f9",
    "--pub-table-alt-bg":     isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.02)",
    "--pub-table-hover-bg":   isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
    "--pub-card-bg":          isDark ? "rgba(255,255,255,0.045)" : "rgba(0,0,0,0.025)",
    "--pub-header-border":    isDark ? "rgba(255,255,255,0.065)" : "rgba(0,0,0,0.065)",
    // Expose selected page font for body text in .pub-content
    "--pub-font-body":        fontStyle.fontFamily as string ?? "inherit",
  } as React.CSSProperties;

  return (
    <main
      className="min-h-screen w-full relative"
      style={{ backgroundColor: bgHex, ...fontStyle, ...cssVars }}
    >
      {/* ── Cover image ── */}
      {page.coverImage && (
        <div className="relative z-10 w-full" style={{ height: "300px" }}>
          <Image
            src={page.coverImage}
            alt=""
            fill
            sizes="100vw"
            priority
            style={{ objectFit: "cover" }}
          />
        </div>
      )}

      {/* Radial gradient depth accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: [
            `radial-gradient(ellipse 700px 480px at 90% -8%, ${accentColor}12 0%, transparent 65%)`,
            `radial-gradient(ellipse 500px 360px at -8% 96%, ${accentColor}09 0%, transparent 60%)`,
          ].join(", "),
        }}
      />

      {/* ── Header bar — only shown when page is personalised ── */}
      {personName && (
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
      )}

      {/* ── Main content column ── */}
      <div
        className="relative z-10 mx-auto px-6 pb-16"
        style={{ maxWidth, paddingTop: page.coverImage ? "40px" : "72px" }}
      >
        {/* Personalisation banner */}
        {personName && (
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
        )}

        {/* Logo */}
        {page.logoUrl && (
          <Image
            src={page.logoUrl}
            alt="Logo"
            width={180}
            height={36}
            style={{
              height: "36px",
              width: "auto",
              objectFit: "contain",
              marginBottom: "2.25rem",
              display: "block",
            }}
          />
        )}

        {/* Page title */}
        <h1
          className="pub-title"
          style={{
            fontFamily: "var(--pub-font-body, inherit)",
            fontSize: "clamp(2rem, 5.5vw, 3.5rem)",
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 1.08,
            color: "var(--pub-heading-color)",
            marginBottom: "2.75rem",
            marginTop: 0,
          }}
        >
          {page.title}
        </h1>

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
      </div>

      {/* ── Footer ── */}
      <footer
        className="relative z-10 py-10 text-center"
        style={{ borderTop: "1px solid var(--pub-header-border)" }}
      >
        <span
          className="select-none"
          style={{
            fontFamily: "var(--font-syne, var(--font-montserrat), sans-serif)",
            fontSize: "0.6875rem",
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: isDark ? "#2e2e48" : "#c4c9d4",
          }}
        >
          Powered by SalesRoom
        </span>
      </footer>

      <AnalyticsTracker pageId={page.id} />
      <BuyerAnalyticsTracker
        pageId={page.id}
        initialTabId={tabs[0]?.id}
        initialTabName={tabs[0]?.name}
        refToken={refToken ?? undefined}
        recordingEnabled={page.recordingEnabled}
      />
      <PublishedFormHydrator pageId={page.id} accentColor={accentColor} />
    </main>
  );
}
