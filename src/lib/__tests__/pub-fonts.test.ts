import { describe, expect, it } from "vitest";
import { ALL_PUB_FONT_KEYS, PUB_FONT_DEFS, googleFontsHref } from "../pub-fonts";
import { FONT_OPTIONS } from "../page-styles";

describe("googleFontsHref", () => {
  it("returns null when nothing needs downloading", () => {
    expect(googleFontsHref([])).toBeNull();
    expect(googleFontsHref([null, undefined, ""])).toBeNull();
    expect(googleFontsHref(["georgia", "mono"])).toBeNull(); // system fonts
    expect(googleFontsHref(["not-a-font"])).toBeNull();
  });

  it("builds a css2 URL for a single family", () => {
    expect(googleFontsHref(["dmsans"])).toBe(
      "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap"
    );
  });

  it("combines body + heading families and dedupes", () => {
    const href = googleFontsHref(["playfair", "inter", "playfair"]);
    expect(href).toContain("family=Playfair+Display:wght@400;500;600;700");
    expect(href).toContain("family=Inter:");
    expect(href?.match(/Playfair/g)).toHaveLength(1);
    expect(href?.endsWith("&display=swap")).toBe(true);
  });

  it("skips system fonts mixed with downloadable ones", () => {
    const href = googleFontsHref(["georgia", "sourceserif"]);
    expect(href).toBe(
      "https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;500;600;700&display=swap"
    );
  });

  it("handles italic axes (Instrument Serif)", () => {
    expect(googleFontsHref(["instrument"])).toContain(
      "family=Instrument+Serif:ital,wght@0,400;1,400"
    );
  });
});

describe("PUB_FONT_DEFS", () => {
  it("covers every FONT_OPTIONS key", () => {
    for (const opt of FONT_OPTIONS) {
      expect(
        PUB_FONT_DEFS[opt.value],
        `missing PUB_FONT_DEFS entry for "${opt.value}"`
      ).toBeDefined();
    }
  });

  it("every downloadable family's literal name appears in its font stack", () => {
    for (const opt of FONT_OPTIONS) {
      const def = PUB_FONT_DEFS[opt.value];
      if (!def?.family) continue;
      expect(
        String(opt.style.fontFamily),
        `FONT_OPTIONS "${opt.value}" stack must include '${def.family}' so the Google stylesheet resolves`
      ).toContain(def.family);
    }
  });

  it("ALL_PUB_FONT_KEYS matches the def table", () => {
    expect(ALL_PUB_FONT_KEYS).toEqual(Object.keys(PUB_FONT_DEFS));
  });
});
