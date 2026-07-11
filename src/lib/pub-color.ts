/**
 * Pure color math for the buyer-facing published page ("pub") theme.
 *
 * From a single seller brand color + the page background, `deriveBrandRamp`
 * produces the full brand-washed color system the published page renders
 * with: tinted neutrals for text, accent-tinted surfaces, soft gradient
 * washes, and contrast-guarded accent variants. Everything here is pure and
 * unit-tested (src/lib/__tests__/pub-color.test.ts).
 *
 * These are derivations of USER brand data (like page-styles.ts), not
 * app-chrome tokens — the file is allowlisted in scripts/check-design-tokens.mjs.
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

const FALLBACK_ACCENT = "#64748b";

export function hexToRgb(hex: string): RGB | null {
  if (typeof hex !== "string") return null;
  let h = hex.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(h)) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function rgbToHex(rgb: RGB): string {
  const to2 = (v: number) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0");
  return `#${to2(rgb.r)}${to2(rgb.g)}${to2(rgb.b)}`;
}

export function hexToHsl(hex: string): HSL | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return { h, s: s * 100, l: l * 100 };
}

export function hslToHex(hsl: HSL): string {
  const h = ((hsl.h % 360) + 360) % 360;
  const s = clamp(hsl.s, 0, 100) / 100;
  const l = clamp(hsl.l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let rgb: [number, number, number];
  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return rgbToHex({ r: (rgb[0] + m) * 255, g: (rgb[1] + m) * 255, b: (rgb[2] + m) * 255 });
}

/** sRGB mix of two hex colors; `weightA` is the share of `hexA`, 0–1. */
export function mix(hexA: string, hexB: string, weightA: number): string {
  const a = hexToRgb(hexA) ?? hexToRgb(FALLBACK_ACCENT)!;
  const b = hexToRgb(hexB) ?? hexToRgb(FALLBACK_ACCENT)!;
  const w = clamp(weightA, 0, 1);
  return rgbToHex({
    r: a.r * w + b.r * (1 - w),
    g: a.g * w + b.g * (1 - w),
    b: a.b * w + b.b * (1 - w),
  });
}

/** rgba() string for a hex color at the given alpha. */
export function hexAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex) ?? hexToRgb(FALLBACK_ACCENT)!;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${clamp(alpha, 0, 1)})`;
}

/** WCAG relative luminance, 0 (black) – 1 (white). */
export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex) ?? hexToRgb(FALLBACK_ACCENT)!;
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
}

/** WCAG contrast ratio between two hex colors, 1–21. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** True for colors that should be treated as a dark canvas (light text on top). */
export function isDarkColor(hex: string): boolean {
  return relativeLuminance(hex) < 0.35;
}

/**
 * Nudge `fg` lighter or darker (away from the background's luminance) until
 * it reaches at least `min` contrast against `bg`. Clamps at pure black/white;
 * if even the extreme can't reach `min`, returns whichever extreme is better.
 */
export function ensureContrast(fg: string, bg: string, min: number): string {
  const start = hexToHsl(fg) ?? hexToHsl(FALLBACK_ACCENT)!;
  if (contrastRatio(hslToHex(start), bg) >= min) return hslToHex(start);
  const lighten = isDarkColor(bg);
  const hsl = { ...start };
  while (lighten ? hsl.l < 100 : hsl.l > 0) {
    hsl.l = clamp(hsl.l + (lighten ? 2 : -2), 0, 100);
    if (contrastRatio(hslToHex(hsl), bg) >= min) return hslToHex(hsl);
  }
  return contrastRatio("#ffffff", bg) >= contrastRatio("#000000", bg) ? "#ffffff" : "#000000";
}

/**
 * Ink color for text placed ON a solid accent fill (buttons, banners,
 * inverted cards): white when it clears 4.5:1, else the darkest ink that does
 * (falling back to whichever extreme is stronger for mid-tone accents).
 */
export function accentInk(accent: string): string {
  if (contrastRatio("#ffffff", accent) >= 4.5) return "#ffffff";
  if (contrastRatio("#17171a", accent) >= 4.5) return "#17171a";
  return contrastRatio("#ffffff", accent) >= contrastRatio("#000000", accent)
    ? "#ffffff"
    : "#000000";
}

/**
 * The complete derived color system for one brand color on one background.
 * Solid values are hex; layered values (surfaces, dividers) are rgba strings.
 */
export interface PubRamp {
  heading: string;
  subheading: string;
  body: string;
  muted: string;
  surface: string;
  surfaceStrong: string;
  divider: string;
  tabBg: string;
  tableHeaderBg: string;
  tableAltBg: string;
  tableHoverBg: string;
  cardBg: string;
  headerBorder: string;
  /** Accent guaranteed >= 4.5:1 vs the background — the only accent safe for text. */
  accentSafe: string;
  /** Deep/ink variant of the accent — inverted brand cards, cover scrims. */
  accentDeep: string;
  /** Soft solid tint of the accent over the background — chips, soft fills. */
  accentSoft: string;
  /** Text color for content sitting on a solid accent fill. */
  accentInk: string;
  /** Two solid gradient stops for brand-washed containers (washA → washB). */
  washA: string;
  washB: string;
}

/**
 * Derive the published-page color ramp from one brand hex + the page
 * background hex. Neutrals are "brand-washed": mixed a few percent toward the
 * accent hue (instead of fixed grays) and contrast-guarded, so the whole page
 * carries the brand tone while staying readable on any light or dark canvas.
 */
export function deriveBrandRamp(accentHex: string, bgHex: string): PubRamp {
  const accent = hexToRgb(accentHex) ? accentHex : FALLBACK_ACCENT;
  const bg = hexToRgb(bgHex) ? bgHex : "#ffffff";
  const dark = isDarkColor(bg);

  // Brand-washed neutral text ramp, guarded at 7 / 4.5 / 4.5 / 3.
  const heading = ensureContrast(mix(accent, dark ? "#f5f5f6" : "#17171a", 0.1), bg, 7);
  const subheading = ensureContrast(mix(accent, dark ? "#c8c8d0" : "#3a3a42", 0.08), bg, 4.5);
  const body = ensureContrast(mix(accent, dark ? "#a4a4ad" : "#5f5f66", 0.06), bg, 4.5);
  const muted = ensureContrast(mix(accent, dark ? "#6e6e78" : "#97979f", 0.05), bg, 3);

  // Accent-tinted layered surfaces (rgba so they compose over the canvas).
  const surfaceBase = dark ? mix(accent, "#ffffff", 0.3) : mix(accent, "#000000", 0.25);
  const surface = hexAlpha(surfaceBase, dark ? 0.07 : 0.04);
  const surfaceStrong = hexAlpha(surfaceBase, dark ? 0.11 : 0.07);
  const divider = hexAlpha(surfaceBase, dark ? 0.14 : 0.11);
  const headerBorder = hexAlpha(surfaceBase, dark ? 0.12 : 0.1);
  const cardBg = hexAlpha(surfaceBase, dark ? 0.06 : 0.035);
  const tableAltBg = hexAlpha(surfaceBase, dark ? 0.04 : 0.025);
  const tableHoverBg = hexAlpha(surfaceBase, dark ? 0.08 : 0.045);
  const tableHeaderBg = mix(accent, dark ? mix("#ffffff", bg, 0.08) : mix("#000000", bg, 0.05), 0.07);
  const tabBg = hexAlpha(mix(accent, bg, 0.05), 0.9);

  // Contrast-guarded accent variants.
  const accentSafe = ensureContrast(accent, bg, 4.5);
  const accentHsl = hexToHsl(accent)!;
  const accentDeep = hslToHex({
    h: accentHsl.h,
    s: Math.min(accentHsl.s, 72),
    l: dark ? 20 : 14,
  });
  const accentSoft = mix(accent, bg, dark ? 0.2 : 0.12);

  // Soft brand-washed gradient stops for framed containers.
  const washA = mix(accent, bg, dark ? 0.16 : 0.1);
  const washB = mix(accent, bg, dark ? 0.07 : 0.04);

  return {
    heading,
    subheading,
    body,
    muted,
    surface,
    surfaceStrong,
    divider,
    tabBg,
    tableHeaderBg,
    tableAltBg,
    tableHoverBg,
    cardBg,
    headerBorder,
    accentSafe,
    accentDeep,
    accentSoft,
    accentInk: accentInk(accent),
    washA,
    washB,
  };
}
