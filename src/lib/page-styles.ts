import type { CSSProperties } from "react";

export const ACCENT_COLORS: Record<string, string> = {
  slate: "#64748b",
  violet: "#7c3aed",
  rose: "#e11d48",
  amber: "#d97706",
  emerald: "#059669",
  sky: "#0284c7",
};

export const ACCENT_LABELS: Record<string, string> = {
  slate: "Slate",
  violet: "Violet",
  rose: "Rose",
  amber: "Amber",
  emerald: "Emerald",
  sky: "Sky",
};

export const FONT_OPTIONS = [
  { value: "inter", label: "Inter", style: { fontFamily: "var(--font-inter), Inter, sans-serif" } },
  { value: "georgia", label: "Georgia", style: { fontFamily: "Georgia, serif" } },
  { value: "playfair", label: "Playfair", style: { fontFamily: "var(--font-playfair), 'Playfair Display', Georgia, serif" } },
  { value: "mono", label: "Mono", style: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" } },
  { value: "lora", label: "Lora", style: { fontFamily: "var(--font-lora), Georgia, serif" } },
  { value: "dmsans", label: "DM Sans", style: { fontFamily: "var(--font-dm-sans), sans-serif" } },
  { value: "instrument", label: "Instrument Serif", style: { fontFamily: "var(--font-serif), 'Instrument Serif', Georgia, serif" } },
  { value: "syne", label: "Syne", style: { fontFamily: "var(--font-syne), sans-serif" } },
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

// Pre-configured theme presets for one-click elegant styling
export interface ThemePreset {
  id: string;
  label: string;
  font: string;
  accentColor: string;
  background: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: "classic", label: "Classic", font: "inter", accentColor: "#64748b", background: "white" },
  { id: "elegant", label: "Elegant", font: "instrument", accentColor: "#0f172a", background: "cream" },
  { id: "modern", label: "Modern", font: "dmsans", accentColor: "#2563eb", background: "gray" },
  { id: "bold", label: "Bold", font: "syne", accentColor: "#7c3aed", background: "dark" },
  { id: "warm", label: "Warm", font: "lora", accentColor: "#d97706", background: "warm" },
  { id: "editorial", label: "Editorial", font: "playfair", accentColor: "#0f172a", background: "white" },
];

export const WIDTH_OPTIONS = [
  { value: "narrow", label: "Narrow", class: "max-w-2xl" },
  { value: "default", label: "Default", class: "max-w-3xl" },
  { value: "wide", label: "Wide", class: "max-w-5xl" },
];

export function getLayoutClass(width: string): string {
  return WIDTH_OPTIONS.find((o) => o.value === width)?.class ?? "max-w-3xl";
}

export function getBgClass(background: string): string {
  return BACKGROUND_OPTIONS.find((o) => o.value === background)?.bgClass ?? "bg-white";
}

export function getBgHex(background: string): string {
  return BACKGROUND_OPTIONS.find((o) => o.value === background)?.hex ?? "#ffffff";
}

export function getFontStyle(font: string): CSSProperties {
  return FONT_OPTIONS.find((o) => o.value === font)?.style ?? {};
}

export function getAccentColor(accentColor: string): string {
  // New format: raw hex value stored directly
  if (accentColor?.startsWith("#")) return accentColor;
  // Legacy format: named key (backward compat with existing pages)
  return ACCENT_COLORS[accentColor] ?? "#64748b";
}

export interface PageStyle {
  font: string;
  accentColor: string;
  layoutWidth: string;
  background: string;
  tabPlacement: string;
  logoUrl: string;
}

export const DEFAULT_PAGE_STYLE: PageStyle = {
  font: "inter",
  accentColor: "#64748b",
  layoutWidth: "default",
  background: "white",
  tabPlacement: "top",
  logoUrl: "",
};
