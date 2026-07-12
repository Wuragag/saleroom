import type { CSSProperties } from "react";
import { BACKGROUND_OPTIONS, COVER_HEIGHTS, DEPTH_OPTIONS, RADIUS_OPTIONS, getBgHex, getFontStyle } from "./page-styles";
import { deriveBrandRamp, hexAlpha } from "./pub-color";

/**
 * Shared published-page theme helpers, consumed by the public page
 * (/p/[slug]), the preview (/preview/[id]) and the WYSIWYG editor
 * (/editor/[id]) so all three render the page identically.
 *
 * The whole visual system derives from two user choices — brand accent +
 * background — via deriveBrandRamp (pub-color.ts): brand-washed neutrals,
 * accent-tinted surfaces and contrast-guarded accent variants.
 */

export function isDarkBackground(background: string | null | undefined): boolean {
  return BACKGROUND_OPTIONS.find((o) => o.value === background)?.dark ?? false;
}

const MAX_WIDTHS: Record<string, string> = {
  narrow: "580px",
  default: "720px",
  wide: "940px",
};

export function getMaxWidth(layoutWidth?: string | null): string {
  return MAX_WIDTHS[layoutWidth ?? "default"] ?? "720px";
}

export function getCoverHeight(coverHeight?: string | null, coverLayout?: string | null): number {
  const opt = COVER_HEIGHTS.find((o) => o.value === (coverHeight ?? "default")) ?? COVER_HEIGHTS[1];
  return coverLayout === "overlay" ? opt.overlayPx : opt.px;
}

function getRadiusVars(themeRadius?: string | null) {
  const opt = RADIUS_OPTIONS.find((o) => o.value === (themeRadius ?? "default")) ?? RADIUS_OPTIONS[1];
  return { sm: opt.sm, md: opt.md, lg: opt.lg };
}

function getShadowVars(themeDepth: string | null | undefined, accentColor: string, isDark: boolean) {
  const depth = DEPTH_OPTIONS.some((o) => o.value === themeDepth) ? themeDepth : "default";
  const ink = isDark ? "rgba(0,0,0,0.5)" : "rgba(23,23,26,0.07)";
  const inkStrong = isDark ? "rgba(0,0,0,0.6)" : "rgba(23,23,26,0.11)";
  if (depth === "flat") {
    // Valid no-op shadow so the vars stay composable in comma-separated lists
    const none = "0 0 0 0 rgba(0,0,0,0)";
    return { sm: none, md: none, lg: none };
  }
  if (depth === "elevated") {
    const tint = hexAlpha(accentColor, isDark ? 0.28 : 0.12);
    return {
      sm: `0 2px 8px ${ink}`,
      md: `0 8px 28px ${inkStrong}, 0 2px 8px ${tint}`,
      lg: `0 20px 56px ${inkStrong}, 0 6px 20px ${tint}`,
    };
  }
  return {
    sm: `0 1px 4px ${ink}`,
    md: `0 4px 16px ${ink}`,
    lg: `0 12px 36px ${inkStrong}`,
  };
}

/** Theme CSS variables — consumed by .pub-content CSS in globals.css */
export function getPubCssVars(opts: {
  accentColor: string;
  background: string | null | undefined;
  font: string;
  headingFont?: string | null;
  themeRadius?: string | null;
  themeDepth?: string | null;
}): CSSProperties {
  const isDark = isDarkBackground(opts.background);
  const bgHex = getBgHex(opts.background ?? "white");
  const ramp = deriveBrandRamp(opts.accentColor, bgHex);
  const fontStyle = getFontStyle(opts.font);
  const headingStyle = opts.headingFont ? getFontStyle(opts.headingFont) : {};
  const bodyFamily = (fontStyle.fontFamily as string) ?? "inherit";
  const headingFamily = (headingStyle.fontFamily as string) ?? bodyFamily;
  const radius = getRadiusVars(opts.themeRadius);
  const shadow = getShadowVars(opts.themeDepth, opts.accentColor, isDark);
  return {
    "--pub-accent":           opts.accentColor,
    // Contrast-guarded accent variants — accent-safe is the ONLY accent to
    // use for text; ink goes on solid accent fills.
    "--pub-accent-safe":      ramp.accentSafe,
    "--pub-accent-ink":       ramp.accentInk,
    // Soft brand-washed gradient for framed containers (media, cards).
    "--pub-wash":             `linear-gradient(135deg, ${ramp.washA} 0%, ${ramp.washB} 100%)`,
    // Metrics stat-chip fill — single source shared with getEditorNodeVars
    // and page-renderer.tsx so editor/published can't drift.
    "--metric-cell-bg":       isDark ? ramp.surfaceStrong : "rgba(255,255,255,0.85)",
    // Brand-washed neutral ramp derived from the accent (pub-color.ts).
    "--pub-heading-color":    ramp.heading,
    "--pub-subheading-color": ramp.subheading,
    "--pub-body-color":       ramp.body,
    "--pub-muted-color":      ramp.muted,
    "--pub-surface":          ramp.surface,
    "--pub-divider":          ramp.divider,
    "--pub-tab-bg":           ramp.tabBg,
    "--pub-table-header-bg":  ramp.tableHeaderBg,
    "--pub-table-alt-bg":     ramp.tableAltBg,
    "--pub-table-hover-bg":   ramp.tableHoverBg,
    "--pub-card-bg":          ramp.cardBg,
    "--pub-header-border":    ramp.headerBorder,
    // Radius + depth "vibe" scales — every card/table/media/button follows.
    "--pub-radius-sm":        radius.sm,
    "--pub-radius-md":        radius.md,
    "--pub-radius-lg":        radius.lg,
    "--pub-shadow-sm":        shadow.sm,
    "--pub-shadow-md":        shadow.md,
    "--pub-shadow-lg":        shadow.lg,
    // Fonts: the seller's body font drives the page; headings may pair a
    // display font on top (Design → Typography).
    "--pub-font-body":        bodyFamily,
    "--pub-font-heading":     headingFamily,
    "--pub-title-weight":     opts.headingFont ? "700" : "600",
  } as CSSProperties;
}

/** Radial gradient depth accents layered behind the content */
export function getAccentGradients(accentColor: string, isDark = false): string {
  const dark = isDark;
  // Strong enough to read as a brand wash (Pitch-style hero tint), soft
  // enough to sit behind long-form content.
  const a = dark ? "2e" : "1f";
  const b = dark ? "1a" : "12";
  const c = dark ? "24" : "14";
  return [
    `radial-gradient(ellipse 900px 540px at 50% -12%, ${accentColor}${c} 0%, transparent 62%)`,
    `radial-gradient(ellipse 700px 480px at 90% -8%, ${accentColor}${a} 0%, transparent 65%)`,
    `radial-gradient(ellipse 500px 360px at -8% 96%, ${accentColor}${b} 0%, transparent 60%)`,
  ].join(", ");
}

/**
 * Editor-canvas node theming — the exact "--node-…" / "--metric-…" variables
 * the Tiptap node-views consume, derived from the same ramp as the published
 * renderer so the editing and published views can never drift apart.
 * Consumed in tiptap-editor.tsx (merged onto <main> with --page-accent).
 */
export function getEditorNodeVars(accentColor: string, background?: string | null): CSSProperties {
  const isDark = isDarkBackground(background);
  const bgHex = getBgHex(background ?? "white");
  const ramp = deriveBrandRamp(accentColor, bgHex);
  return {
    "--node-card-bg":     isDark ? ramp.cardBg : "#ffffff",
    "--node-card-border": ramp.divider,
    "--node-text":        ramp.heading,
    "--node-muted":       ramp.muted,
    "--node-accent-safe": ramp.accentSafe,
    "--node-accent-ink":  ramp.accentInk,
    "--node-wash":        `linear-gradient(135deg, ${ramp.washA} 0%, ${ramp.washB} 100%)`,
    // Metrics render as solid stat chips on the wash (see page-renderer.tsx)
    "--metric-cell-bg":   isDark ? ramp.surfaceStrong : "rgba(255,255,255,0.85)",
  } as CSSProperties;
}
