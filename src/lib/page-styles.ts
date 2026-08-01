import type { CSSProperties } from "react";

export const ACCENT_COLORS: Record<string, string> = {
  slate: "#64748b",
  violet: "#7c3aed",
  rose: "#e11d48",
  amber: "#d97706",
  emerald: "#059669",
  sky: "#0284c7",
};

// Buyer-page fonts. Chrome-hosted families (DM Sans, Instrument Serif, Inter)
// resolve via their next/font CSS vars; everything else loads per page through
// a Google Fonts stylesheet (src/lib/pub-fonts.ts + PubFontLinks), so each
// stack must include the literal family name.
export const FONT_OPTIONS = [
  { value: "inter", label: "Inter", style: { fontFamily: "var(--font-inter), Inter, sans-serif" } },
  { value: "georgia", label: "Georgia", style: { fontFamily: "Georgia, serif" } },
  { value: "playfair", label: "Playfair", style: { fontFamily: "'Playfair Display', Georgia, serif" } },
  { value: "mono", label: "Mono", style: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" } },
  { value: "lora", label: "Lora", style: { fontFamily: "Lora, Georgia, serif" } },
  { value: "dmsans", label: "DM Sans", style: { fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" } },
  { value: "instrument", label: "Instrument Serif", style: { fontFamily: "var(--font-serif), 'Instrument Serif', Georgia, serif" } },
  { value: "syne", label: "Syne", style: { fontFamily: "Syne, sans-serif" } },
  { value: "spacegrotesk", label: "Space Grotesk", style: { fontFamily: "'Space Grotesk', sans-serif" } },
  { value: "fraunces", label: "Fraunces", style: { fontFamily: "Fraunces, Georgia, serif" } },
  { value: "sourceserif", label: "Source Serif", style: { fontFamily: "'Source Serif 4', Georgia, serif" } },
  { value: "ibmplex", label: "IBM Plex Sans", style: { fontFamily: "'IBM Plex Sans', sans-serif" } },
];

export const BACKGROUND_OPTIONS = [
  { value: "white", label: "White", bgClass: "bg-white", hex: "#ffffff", dark: false },
  { value: "cream", label: "Cream", bgClass: "bg-[#fdf8f0]", hex: "#fdf8f0", dark: false },
  { value: "gray", label: "Gray", bgClass: "bg-gray-50", hex: "#f9fafb", dark: false },
  { value: "warm", label: "Warm", bgClass: "bg-[#fafaf8]", hex: "#fafaf8", dark: false },
  { value: "slate", label: "Slate", bgClass: "bg-[#f1f5f9]", hex: "#f1f5f9", dark: false },
  { value: "dark", label: "Dark", bgClass: "bg-gray-950", hex: "#030712", dark: true },
  { value: "navy", label: "Navy", bgClass: "bg-[#0f172a]", hex: "#0f172a", dark: true },
];

// Curated heading/body font pairings. Buyer pages only download the families
// a pairing actually uses (see pub-fonts.ts). headingFont "" = same as body.
export interface FontPairing {
  id: string;
  label: string;
  heading: string;
  body: string;
}

export const FONT_PAIRINGS: FontPairing[] = [
  { id: "uniform", label: "Uniform", heading: "", body: "dmsans" },
  { id: "editorial", label: "Editorial", heading: "playfair", body: "inter" },
  { id: "refined", label: "Refined", heading: "instrument", body: "dmsans" },
  { id: "modern", label: "Modern", heading: "syne", body: "inter" },
  { id: "warm", label: "Warm", heading: "lora", body: "dmsans" },
  { id: "classic", label: "Classic", heading: "georgia", body: "inter" },
  { id: "structured", label: "Structured", heading: "spacegrotesk", body: "inter" },
  { id: "literary", label: "Literary", heading: "fraunces", body: "sourceserif" },
  { id: "technical", label: "Technical", heading: "spacegrotesk", body: "ibmplex" },
  { id: "serifduo", label: "Serif Duo", heading: "playfair", body: "sourceserif" },
  { id: "contrast", label: "Contrast", heading: "syne", body: "sourceserif" },
  { id: "quiet", label: "Quiet", heading: "fraunces", body: "ibmplex" },
];

// Corner-radius scale for cards/tables/media/buttons on the published page.
export const RADIUS_OPTIONS = [
  { value: "sharp", label: "Sharp", sm: "3px", md: "5px", lg: "8px" },
  { value: "default", label: "Default", sm: "8px", md: "12px", lg: "16px" },
  { value: "soft", label: "Soft", sm: "12px", md: "18px", lg: "28px" },
];

// Shadow/depth intensity for the same surfaces.
export const DEPTH_OPTIONS = [
  { value: "flat", label: "Flat" },
  { value: "default", label: "Default" },
  { value: "elevated", label: "Elevated" },
];

// Cover image heights; overlay layout gets extra room for the title block.
export const COVER_HEIGHTS = [
  { value: "compact", label: "Compact", px: 220, overlayPx: 300 },
  { value: "default", label: "Default", px: 320, overlayPx: 420 },
  { value: "tall", label: "Tall", px: 460, overlayPx: 560 },
];

export const COVER_LAYOUTS = [
  { value: "standard", label: "Standard" },
  { value: "overlay", label: "Title on cover" },
];

// Hero arrangement: logo/eyebrow/title/subtitle alignment and scale.
export const HERO_LAYOUTS = [
  { value: "left", label: "Left" },
  { value: "centered", label: "Centered" },
  { value: "compact", label: "Compact" },
];

// Pre-configured theme presets for one-click elegant styling
export interface ThemePreset {
  id: string;
  label: string;
  font: string;
  headingFont: string;
  accentColor: string;
  background: string;
  themeRadius: string;
  themeDepth: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: "classic", label: "Classic", font: "inter", headingFont: "", accentColor: "#64748b", background: "white", themeRadius: "default", themeDepth: "default" },
  { id: "elegant", label: "Elegant", font: "dmsans", headingFont: "instrument", accentColor: "#0f172a", background: "cream", themeRadius: "soft", themeDepth: "flat" },
  { id: "modern", label: "Modern", font: "inter", headingFont: "syne", accentColor: "#2563eb", background: "gray", themeRadius: "soft", themeDepth: "elevated" },
  { id: "bold", label: "Bold", font: "syne", headingFont: "", accentColor: "#7c3aed", background: "dark", themeRadius: "default", themeDepth: "elevated" },
  { id: "warm", label: "Warm", font: "lora", headingFont: "", accentColor: "#d97706", background: "warm", themeRadius: "soft", themeDepth: "default" },
  { id: "editorial", label: "Editorial", font: "inter", headingFont: "playfair", accentColor: "#0f172a", background: "white", themeRadius: "sharp", themeDepth: "flat" },
  { id: "product", label: "Product", font: "inter", headingFont: "spacegrotesk", accentColor: "#2563eb", background: "white", themeRadius: "default", themeDepth: "default" },
  { id: "literary", label: "Literary", font: "sourceserif", headingFont: "fraunces", accentColor: "#1c1917", background: "cream", themeRadius: "sharp", themeDepth: "flat" },
  { id: "studio", label: "Studio", font: "ibmplex", headingFont: "fraunces", accentColor: "#0d9488", background: "warm", themeRadius: "soft", themeDepth: "flat" },
];

export const WIDTH_OPTIONS = [
  { value: "narrow", label: "Narrow", class: "max-w-2xl" },
  { value: "default", label: "Default", class: "max-w-3xl" },
  { value: "wide", label: "Wide", class: "max-w-5xl" },
];

export function getBgHex(background: string): string {
  return BACKGROUND_OPTIONS.find((o) => o.value === background)?.hex ?? "#ffffff";
}

export function getFontStyle(font: string): CSSProperties {
  return FONT_OPTIONS.find((o) => o.value === font)?.style ?? {};
}

export function getAccentColor(accentColor: string): string {
  // New format: raw hex value stored directly. Strict shape check so junk
  // written before server-side validation existed can't reach inline styles.
  if (/^#[0-9a-fA-F]{6}$/.test(accentColor ?? "")) return accentColor;
  // Legacy format: named key (backward compat with existing pages)
  return Object.prototype.hasOwnProperty.call(ACCENT_COLORS, accentColor)
    ? ACCENT_COLORS[accentColor]
    : "#64748b";
}

export interface PageStyle {
  font: string;
  headingFont: string;
  accentColor: string;
  layoutWidth: string;
  background: string;
  tabPlacement: string;
  logoUrl: string;
  coverLayout: string;
  coverHeight: string;
  heroLayout: string;
  themeRadius: string;
  themeDepth: string;
}

export const DEFAULT_PAGE_STYLE: PageStyle = {
  // Editorial baseline: DM Sans (the whole page follows the selected font via
  // --pub-font-body) + ink accent on a clean white canvas. Applied explicitly
  // at page creation (api/pages, api/pages/from-template) — the DB column
  // defaults predate the redesign.
  font: "dmsans",
  headingFont: "",
  accentColor: "#17171a",
  layoutWidth: "default",
  background: "white",
  tabPlacement: "top",
  logoUrl: "",
  coverLayout: "standard",
  coverHeight: "default",
  heroLayout: "left",
  themeRadius: "default",
  themeDepth: "default",
};
