import type { CSSProperties, ReactNode } from "react";
import { getAccentGradients } from "@/lib/pub-theme";
import { APP_NAME } from "@/lib/constants";

interface PageShellProps {
  bgHex: string;
  fontStyle: CSSProperties;
  cssVars: CSSProperties;
  accentColor: string;
  isDark: boolean;
  maxWidth: string;
  /** Full-width strip above everything (e.g. preview banner) */
  banner?: ReactNode;
  /** Full-width cover image area, rendered below the banner */
  coverImage?: ReactNode;
  /** Full-width header bar (e.g. personalization header) */
  header?: ReactNode;
  /** Rendered inside the content column, before the logo (e.g. personalization intro) */
  intro?: ReactNode;
  /** Logo slot, rendered above the title */
  logo?: ReactNode;
  /** Small uppercase label above the title (hero eyebrow) */
  eyebrow?: ReactNode;
  /** Page title slot (h1.pub-title on published pages, editable in the editor).
   *  Omit when the hero is rendered elsewhere (cover overlay layout). */
  title?: ReactNode;
  /** Hero subtitle rendered under the title */
  subtitle?: ReactNode;
  /** Column top padding — published pages use 40px with a cover, 72px without */
  paddingTop?: string;
  children: ReactNode;
  /** Rendered after the footer (trackers, hydrators, pickers) */
  trailing?: ReactNode;
  /** Extra styles merged onto <main> (e.g. --page-accent in the editor) */
  style?: CSSProperties;
  /** "Powered by" footer badge; hidden for plans with white-label branding */
  showBranding?: boolean;
}

/**
 * Shared published-page shell: background, theme CSS vars, gradient depth
 * accents, content column, logo, eyebrow, title, subtitle and footer. Used by
 * /p/[slug], /preview/[id] and the WYSIWYG editor so all three look identical.
 */
export function PageShell({
  bgHex,
  fontStyle,
  cssVars,
  accentColor,
  isDark,
  maxWidth,
  banner,
  coverImage,
  header,
  intro,
  logo,
  eyebrow,
  title,
  subtitle,
  paddingTop = "72px",
  children,
  trailing,
  style,
  showBranding = true,
}: PageShellProps) {
  return (
    <main
      className="min-h-screen w-full relative"
      style={{ backgroundColor: bgHex, ...fontStyle, ...cssVars, ...style }}
    >
      {banner}

      {coverImage}

      {/* Radial gradient depth accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: getAccentGradients(accentColor, isDark) }}
      />

      {header}

      {/* ── Main content column ── */}
      <div
        className="relative z-10 mx-auto px-6 pb-16"
        style={{ maxWidth, paddingTop }}
      >
        {intro}

        {logo}

        {/* Hero text block: eyebrow → title → subtitle, one consistent gap after.
            Skipped entirely when the hero lives on the cover (overlay layout). */}
        {(eyebrow || title || subtitle) && (
          <div style={{ marginBottom: PUB_HERO_GAP }}>
            {eyebrow}

            {title}

            {subtitle}
          </div>
        )}

        {children}
      </div>

      {/* ── Footer ── */}
      <footer
        className="relative z-10 py-10 text-center"
        style={{ borderTop: "1px solid var(--pub-header-border)" }}
      >
        {showBranding && (
          <span
            className="select-none"
            style={{
              fontFamily: "var(--font-dm-sans, sans-serif)",
              fontSize: "0.6875rem",
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--pub-muted-color)",
            }}
          >
            Powered by {APP_NAME}
          </span>
        )}
      </footer>

      {trailing}
    </main>
  );
}

/** Published page title styles — shared between the h1 and the editor's editable title */
export const PUB_TITLE_STYLE: CSSProperties = {
  // Heading font when a pairing is set (Design → Typography), else body font
  fontFamily: "var(--pub-font-heading, var(--pub-font-body, inherit))",
  fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
  fontWeight: "var(--pub-title-weight, 600)" as CSSProperties["fontWeight"],
  letterSpacing: "-0.025em",
  lineHeight: 1.08,
  color: "var(--pub-heading-color)",
  marginBottom: 0,
  marginTop: 0,
};

/** Hero eyebrow — small uppercase brand label above the title */
export const PUB_EYEBROW_STYLE: CSSProperties = {
  fontFamily: "var(--pub-font-body, inherit)",
  fontSize: "0.8125rem",
  fontWeight: 600,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--pub-accent-safe, var(--pub-accent))",
  marginBottom: "1.25rem",
  display: "block",
};

/** Hero subtitle under the title */
export const PUB_SUBTITLE_STYLE: CSSProperties = {
  fontFamily: "var(--pub-font-body, inherit)",
  fontSize: "1.1875rem",
  fontWeight: 400,
  lineHeight: 1.55,
  color: "var(--pub-subheading-color)",
  maxWidth: "36rem",
  marginTop: "1rem",
  marginBottom: 0,
};

/** Gap between the hero text block and the page content */
export const PUB_HERO_GAP = "2.75rem";

/** Published logo image styles */
export const PUB_LOGO_STYLE: CSSProperties = {
  height: "36px",
  width: "auto",
  objectFit: "contain",
  marginBottom: "2.25rem",
  display: "block",
};
