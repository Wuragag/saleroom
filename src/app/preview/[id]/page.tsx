import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import Image from "next/image";
import { TabbedPageView } from "@/components/tabbed-page-view";
import { getBgHex, getFontStyle, getAccentColor } from "@/lib/page-styles";
import { PublishedFormHydrator } from "@/components/published-form";
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
  const isDark = page.background === "dark";
  const links = (() => {
    try {
      return JSON.parse(page.links ?? "[]");
    } catch {
      return [];
    }
  })();

  const maxWidths: Record<string, string> = {
    narrow: "580px",
    default: "720px",
    wide: "940px",
  };
  const maxWidth = maxWidths[page.layoutWidth ?? "default"] ?? "720px";

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
    "--pub-font-body":        fontStyle.fontFamily as string ?? "inherit",
  } as React.CSSProperties;

  return (
    <main
      className="min-h-screen w-full relative"
      style={{ backgroundColor: bgHex, ...fontStyle, ...cssVars }}
    >
      {/* ── Preview banner ── */}
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

      {/* ── Main content column ── */}
      <div
        className="relative z-10 mx-auto px-6 pb-16"
        style={{ maxWidth, paddingTop: "72px" }}
      >
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

      <PublishedFormHydrator pageId={page.id} accentColor={accentColor} />
    </main>
  );
}
