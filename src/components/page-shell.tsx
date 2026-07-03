import type { CSSProperties, ReactNode } from "react";
import { getAccentGradients } from "@/lib/pub-theme";

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
  /** Page title slot (h1.pub-title on published pages, editable in the editor) */
  title: ReactNode;
  /** Column top padding — published pages use 40px with a cover, 72px without */
  paddingTop?: string;
  children: ReactNode;
  /** Rendered after the footer (trackers, hydrators, pickers) */
  trailing?: ReactNode;
  /** Extra styles merged onto <main> (e.g. --page-accent in the editor) */
  style?: CSSProperties;
}

/**
 * Shared published-page shell: background, theme CSS vars, gradient depth
 * accents, content column, logo, title and footer. Used by /p/[slug],
 * /preview/[id] and the WYSIWYG editor so all three look identical.
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
  title,
  paddingTop = "72px",
  children,
  trailing,
  style,
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
        style={{ background: getAccentGradients(accentColor) }}
      />

      {header}

      {/* ── Main content column ── */}
      <div
        className="relative z-10 mx-auto px-6 pb-16"
        style={{ maxWidth, paddingTop }}
      >
        {intro}

        {logo}

        {title}

        {children}
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

      {trailing}
    </main>
  );
}

/** Published page title styles — shared between the h1 and the editor's editable title */
export const PUB_TITLE_STYLE: CSSProperties = {
  fontFamily: "var(--pub-font-body, inherit)",
  fontSize: "clamp(2rem, 5.5vw, 3.5rem)",
  fontWeight: 800,
  letterSpacing: "-0.035em",
  lineHeight: 1.08,
  color: "var(--pub-heading-color)",
  marginBottom: "2.75rem",
  marginTop: 0,
};

/** Published logo image styles */
export const PUB_LOGO_STYLE: CSSProperties = {
  height: "36px",
  width: "auto",
  objectFit: "contain",
  marginBottom: "2.25rem",
  display: "block",
};
