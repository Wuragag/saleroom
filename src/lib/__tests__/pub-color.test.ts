import { describe, expect, it } from "vitest";
import {
  accentInk,
  contrastRatio,
  deriveBrandRamp,
  ensureContrast,
  hexAlpha,
  hexToHsl,
  hexToRgb,
  hslToHex,
  isDarkColor,
  mix,
  relativeLuminance,
  rgbToHex,
} from "../pub-color";
import { BACKGROUND_OPTIONS } from "../page-styles";
import { PRESET_COLORS } from "../color-palettes";

describe("hex conversions", () => {
  it("round-trips rgb", () => {
    expect(rgbToHex(hexToRgb("#7c3aed")!)).toBe("#7c3aed");
    expect(rgbToHex(hexToRgb("#000000")!)).toBe("#000000");
    expect(rgbToHex(hexToRgb("#ffffff")!)).toBe("#ffffff");
  });

  it("expands 3-digit hex", () => {
    expect(hexToRgb("#fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb("#abc")).toEqual(hexToRgb("#aabbcc"));
  });

  it("returns null on garbage", () => {
    expect(hexToRgb("")).toBeNull();
    expect(hexToRgb("#12")).toBeNull();
    expect(hexToRgb("#12345g")).toBeNull();
    expect(hexToRgb("blue")).toBeNull();
    expect(hexToHsl("nope")).toBeNull();
  });

  it("round-trips hsl within 1 step per channel", () => {
    for (const hex of ["#7c3aed", "#e11d48", "#0f172a", "#fdf8f0", "#16a34a"]) {
      const back = hexToRgb(hslToHex(hexToHsl(hex)!))!;
      const orig = hexToRgb(hex)!;
      expect(Math.abs(back.r - orig.r)).toBeLessThanOrEqual(1);
      expect(Math.abs(back.g - orig.g)).toBeLessThanOrEqual(1);
      expect(Math.abs(back.b - orig.b)).toBeLessThanOrEqual(1);
    }
  });

  it("handles achromatic colors in hsl", () => {
    expect(hexToHsl("#808080")).toEqual({ h: 0, s: 0, l: expect.closeTo(50.2, 1) });
    expect(hslToHex({ h: 0, s: 0, l: 100 })).toBe("#ffffff");
  });
});

describe("mix / hexAlpha", () => {
  it("mixes by weight of the first color", () => {
    expect(mix("#000000", "#ffffff", 1)).toBe("#000000");
    expect(mix("#000000", "#ffffff", 0)).toBe("#ffffff");
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
  });

  it("clamps out-of-range weights", () => {
    expect(mix("#000000", "#ffffff", 2)).toBe("#000000");
    expect(mix("#000000", "#ffffff", -1)).toBe("#ffffff");
  });

  it("formats rgba strings", () => {
    expect(hexAlpha("#ff0000", 0.5)).toBe("rgba(255,0,0,0.5)");
  });
});

describe("contrast math", () => {
  it("black on white is 21", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 1);
  });

  it("same color is 1", () => {
    expect(contrastRatio("#7c3aed", "#7c3aed")).toBe(1);
  });

  it("white luminance is 1, black is 0", () => {
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
  });

  it("classifies dark canvases", () => {
    expect(isDarkColor("#030712")).toBe(true);
    expect(isDarkColor("#0f172a")).toBe(true);
    expect(isDarkColor("#ffffff")).toBe(false);
    expect(isDarkColor("#fdf8f0")).toBe(false);
  });
});

describe("ensureContrast", () => {
  it("returns the color unchanged when it already passes", () => {
    expect(ensureContrast("#17171a", "#ffffff", 7)).toBe("#17171a");
  });

  it("fixes yellow on white", () => {
    const fixed = ensureContrast("#eab308", "#ffffff", 4.5);
    expect(contrastRatio(fixed, "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });

  it("fixes navy on navy", () => {
    const fixed = ensureContrast("#0f172a", "#0f172a", 4.5);
    expect(contrastRatio(fixed, "#0f172a")).toBeGreaterThanOrEqual(4.5);
  });

  it("fixes near-white on white at a high minimum", () => {
    const fixed = ensureContrast("#fafafa", "#ffffff", 7);
    expect(contrastRatio(fixed, "#ffffff")).toBeGreaterThanOrEqual(7);
  });

  it("falls back to the stronger extreme when the minimum is unreachable", () => {
    // 21 is only reachable for pure black on pure white; mid-gray bg can't.
    const fixed = ensureContrast("#808080", "#808080", 21);
    expect(["#ffffff", "#000000"]).toContain(fixed);
  });
});

describe("accentInk", () => {
  it("uses white on dark accents", () => {
    expect(accentInk("#0f172a")).toBe("#ffffff");
    expect(accentInk("#7c3aed")).toBe("#ffffff");
  });

  it("uses dark ink on light accents", () => {
    expect(accentInk("#eab308")).toBe("#17171a");
    expect(accentInk("#ffffff")).toBe("#17171a");
  });

  it("always clears 4.5:1 for every preset accent", () => {
    for (const accent of PRESET_COLORS) {
      expect(contrastRatio(accentInk(accent), accent)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("deriveBrandRamp", () => {
  it("meets WCAG minimums for every background × preset accent", () => {
    // The safety net for the whole derived-theme feature.
    for (const bg of BACKGROUND_OPTIONS) {
      for (const accent of PRESET_COLORS) {
        const ramp = deriveBrandRamp(accent, bg.hex);
        const label = `${accent} on ${bg.value}`;
        expect(contrastRatio(ramp.heading, bg.hex), `heading ${label}`).toBeGreaterThanOrEqual(7);
        expect(
          contrastRatio(ramp.subheading, bg.hex),
          `subheading ${label}`
        ).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(ramp.body, bg.hex), `body ${label}`).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(ramp.muted, bg.hex), `muted ${label}`).toBeGreaterThanOrEqual(3);
        expect(
          contrastRatio(ramp.accentSafe, bg.hex),
          `accentSafe ${label}`
        ).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(ramp.accentInk, accent), `accentInk ${label}`).toBeGreaterThanOrEqual(
          4.5
        );
        // Deep accent must carry light ink (it's used for inverted cards/scrims).
        expect(
          contrastRatio("#ffffff", ramp.accentDeep),
          `accentDeep ${label}`
        ).toBeGreaterThanOrEqual(4.5);
        // Washes/soft tints must be valid solid hex.
        for (const solid of [ramp.washA, ramp.washB, ramp.accentSoft, ramp.tableHeaderBg]) {
          expect(solid).toMatch(/^#[0-9a-f]{6}$/);
        }
      }
    }
  });

  it("keeps body text readable on wash fills", () => {
    for (const bg of BACKGROUND_OPTIONS) {
      for (const accent of PRESET_COLORS) {
        const ramp = deriveBrandRamp(accent, bg.hex);
        // Framed containers put body copy on washA — it must stay legible.
        expect(contrastRatio(ramp.body, ramp.washA)).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("falls back safely on invalid inputs", () => {
    const ramp = deriveBrandRamp("not-a-color", "also-bad");
    expect(contrastRatio(ramp.heading, "#ffffff")).toBeGreaterThanOrEqual(7);
    expect(ramp.accentSafe).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("derives a dark ramp for any dark background (navy included)", () => {
    const navy = deriveBrandRamp("#7c3aed", "#0f172a");
    // Light text on a dark canvas, not the old broken light-mode ramp.
    expect(relativeLuminance(navy.heading)).toBeGreaterThan(0.5);
    expect(contrastRatio(navy.heading, "#0f172a")).toBeGreaterThanOrEqual(7);
  });
});
