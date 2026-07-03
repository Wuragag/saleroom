import type { CSSProperties } from "react";
import { getFontStyle } from "./page-styles";

/**
 * Shared published-page theme helpers, consumed by the public page
 * (/p/[slug]), the preview (/preview/[id]) and the WYSIWYG editor
 * (/editor/[id]) so all three render the page identically.
 */

// Note: "navy" has dark: true in BACKGROUND_OPTIONS but the published
// shells have always treated only "dark" as dark — preserved here.
export function isDarkBackground(background: string | null | undefined): boolean {
  return background === "dark";
}

const MAX_WIDTHS: Record<string, string> = {
  narrow: "580px",
  default: "720px",
  wide: "940px",
};

export function getMaxWidth(layoutWidth?: string | null): string {
  return MAX_WIDTHS[layoutWidth ?? "default"] ?? "720px";
}

/** Theme CSS variables — consumed by .pub-content CSS in globals.css */
export function getPubCssVars(opts: {
  accentColor: string;
  background: string | null | undefined;
  font: string;
}): CSSProperties {
  const isDark = isDarkBackground(opts.background);
  const fontStyle = getFontStyle(opts.font);
  return {
    "--pub-accent":           opts.accentColor,
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
    "--pub-font-body":        (fontStyle.fontFamily as string) ?? "inherit",
  } as CSSProperties;
}

/** Radial gradient depth accents layered behind the content */
export function getAccentGradients(accentColor: string): string {
  return [
    `radial-gradient(ellipse 700px 480px at 90% -8%, ${accentColor}12 0%, transparent 65%)`,
    `radial-gradient(ellipse 500px 360px at -8% 96%, ${accentColor}09 0%, transparent 60%)`,
  ].join(", ");
}
