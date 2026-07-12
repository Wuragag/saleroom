import { prisma } from "@/lib/prisma";
import {
  BACKGROUND_OPTIONS,
  DEFAULT_PAGE_STYLE,
  DEPTH_OPTIONS,
  FONT_OPTIONS,
  RADIUS_OPTIONS,
  type PageStyle,
} from "@/lib/page-styles";

/** Parsed brand kit as consumed by the app (secondaryColors is a real array). */
export interface BrandKitData {
  primaryColor: string;
  secondaryColors: string[];
  logoUrl: string;
  font: string;
  headingFont: string;
  background: string;
  themeRadius: string;
  themeDepth: string;
  hideBranding: boolean;
}

export const MAX_SECONDARY_COLORS = 6;

/**
 * Kit shown/used when a team hasn't configured one — the single source of
 * truth for brand defaults (schema.prisma column defaults mirror this).
 * Derived from DEFAULT_PAGE_STYLE so page and kit baselines can't diverge.
 */
export const DEFAULT_BRAND_KIT: BrandKitData = {
  primaryColor: DEFAULT_PAGE_STYLE.accentColor,
  secondaryColors: [],
  logoUrl: "",
  font: DEFAULT_PAGE_STYLE.font,
  headingFont: DEFAULT_PAGE_STYLE.headingFont,
  background: DEFAULT_PAGE_STYLE.background,
  themeRadius: DEFAULT_PAGE_STYLE.themeRadius,
  themeDepth: DEFAULT_PAGE_STYLE.themeDepth,
  hideBranding: false,
};

export function isValidHex(v: unknown): v is string {
  return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
}

export function isValidFontKey(v: unknown): boolean {
  return v === "" || FONT_OPTIONS.some((o) => o.value === v);
}

export function isValidBackgroundKey(v: unknown): boolean {
  return BACKGROUND_OPTIONS.some((o) => o.value === v);
}

export function isValidRadiusKey(v: unknown): boolean {
  return RADIUS_OPTIONS.some((o) => o.value === v);
}

export function isValidDepthKey(v: unknown): boolean {
  return DEPTH_OPTIONS.some((o) => o.value === v);
}

/** Fetch and parse a team's brand kit; null when teamless or not configured. */
export async function getTeamBrandKit(teamId: string | null): Promise<BrandKitData | null> {
  if (!teamId) return null;
  const kit = await prisma.brandKit.findUnique({ where: { teamId } });
  if (!kit) return null;
  let secondary: string[] = [];
  try {
    const parsed = JSON.parse(kit.secondaryColors);
    if (Array.isArray(parsed)) secondary = parsed.filter(isValidHex).slice(0, MAX_SECONDARY_COLORS);
  } catch {
    // malformed JSON → treat as no secondary colors
  }
  return {
    primaryColor: kit.primaryColor,
    secondaryColors: secondary,
    logoUrl: kit.logoUrl,
    font: kit.font,
    headingFont: kit.headingFont,
    background: kit.background,
    themeRadius: kit.themeRadius,
    themeDepth: kit.themeDepth,
    hideBranding: kit.hideBranding,
  };
}

/**
 * The page style a brand kit produces for a NEW page: kit values merged over
 * DEFAULT_PAGE_STYLE, ignoring anything invalid so a bad kit can never break
 * page creation. Pure — tested in src/lib/__tests__/brand-kit.test.ts.
 */
export function brandDefaultPageStyle(kit: BrandKitData | null): PageStyle {
  if (!kit) return { ...DEFAULT_PAGE_STYLE };
  return {
    ...DEFAULT_PAGE_STYLE,
    ...(isValidHex(kit.primaryColor) ? { accentColor: kit.primaryColor } : {}),
    ...(isValidFontKey(kit.font) && kit.font ? { font: kit.font } : {}),
    ...(isValidFontKey(kit.headingFont) ? { headingFont: kit.headingFont } : {}),
    ...(isValidBackgroundKey(kit.background) ? { background: kit.background } : {}),
    ...(isValidRadiusKey(kit.themeRadius) ? { themeRadius: kit.themeRadius } : {}),
    ...(isValidDepthKey(kit.themeDepth) ? { themeDepth: kit.themeDepth } : {}),
    ...(typeof kit.logoUrl === "string" && kit.logoUrl ? { logoUrl: kit.logoUrl } : {}),
  };
}
