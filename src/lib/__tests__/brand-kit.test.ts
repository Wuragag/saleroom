import { describe, expect, it, vi } from "vitest";

// brandDefaultPageStyle / validators are pure; mock the prisma singleton so
// the module loads without a client (getTeamBrandKit isn't exercised here).
vi.mock("@/lib/prisma", () => ({ prisma: { brandKit: { findUnique: vi.fn() } } }));

import {
  brandDefaultPageStyle,
  isValidBackgroundKey,
  isValidFontKey,
  isValidHex,
  type BrandKitData,
} from "@/lib/brand-kit";
import { DEFAULT_PAGE_STYLE } from "@/lib/page-styles";

const kit = (overrides: Partial<BrandKitData> = {}): BrandKitData => ({
  primaryColor: "#7c3aed",
  secondaryColors: [],
  logoUrl: "https://blob.example.com/brand-logos/t1.png",
  font: "inter",
  headingFont: "playfair",
  background: "cream",
  themeRadius: "soft",
  themeDepth: "elevated",
  hideBranding: false,
  ...overrides,
});

describe("isValidHex", () => {
  it("accepts 6-digit hex only", () => {
    expect(isValidHex("#7c3aed")).toBe(true);
    expect(isValidHex("#FFFFFF")).toBe(true);
    expect(isValidHex("#fff")).toBe(false);
    expect(isValidHex("7c3aed")).toBe(false);
    expect(isValidHex("#7c3aeg")).toBe(false);
    expect(isValidHex(null)).toBe(false);
  });
});

describe("key validators", () => {
  it("validates font keys, allowing empty (= same as body)", () => {
    expect(isValidFontKey("")).toBe(true);
    expect(isValidFontKey("playfair")).toBe(true);
    expect(isValidFontKey("comic-sans")).toBe(false);
  });

  it("validates background keys", () => {
    expect(isValidBackgroundKey("navy")).toBe(true);
    expect(isValidBackgroundKey("plaid")).toBe(false);
  });
});

describe("brandDefaultPageStyle", () => {
  it("returns the default style when no kit exists", () => {
    expect(brandDefaultPageStyle(null)).toEqual(DEFAULT_PAGE_STYLE);
  });

  it("merges a full kit over the defaults", () => {
    const style = brandDefaultPageStyle(kit());
    expect(style.accentColor).toBe("#7c3aed");
    expect(style.font).toBe("inter");
    expect(style.headingFont).toBe("playfair");
    expect(style.background).toBe("cream");
    expect(style.themeRadius).toBe("soft");
    expect(style.themeDepth).toBe("elevated");
    expect(style.logoUrl).toBe("https://blob.example.com/brand-logos/t1.png");
    // Untouched fields stay at defaults
    expect(style.layoutWidth).toBe(DEFAULT_PAGE_STYLE.layoutWidth);
    expect(style.tabPlacement).toBe(DEFAULT_PAGE_STYLE.tabPlacement);
    expect(style.coverLayout).toBe(DEFAULT_PAGE_STYLE.coverLayout);
  });

  it("ignores invalid values instead of breaking page creation", () => {
    const style = brandDefaultPageStyle(
      kit({
        primaryColor: "purple",
        font: "comic-sans",
        headingFont: "wingdings",
        background: "plaid",
        themeRadius: "extra-round",
        themeDepth: "bottomless",
        logoUrl: "",
      })
    );
    expect(style).toEqual(DEFAULT_PAGE_STYLE);
  });

  it("keeps an empty headingFont as 'same as body'", () => {
    const style = brandDefaultPageStyle(kit({ headingFont: "" }));
    expect(style.headingFont).toBe("");
  });
});
