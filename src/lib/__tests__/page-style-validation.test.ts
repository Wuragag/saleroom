import { describe, expect, it } from "vitest";
import { validatePageStylePatch } from "../page-style-validation";

describe("validatePageStylePatch", () => {
  it("accepts an empty patch", () => {
    expect(validatePageStylePatch({})).toEqual({ ok: true });
  });

  it("ignores non-style fields", () => {
    expect(
      validatePageStylePatch({ title: 42, content: null, published: "yes" })
    ).toEqual({ ok: true });
  });

  it("accepts a full valid style patch", () => {
    expect(
      validatePageStylePatch({
        font: "dmsans",
        headingFont: "playfair",
        accentColor: "#2563eb",
        layoutWidth: "wide",
        background: "navy",
        tabPlacement: "left",
        coverLayout: "overlay",
        coverHeight: "tall",
        heroLayout: "centered",
        themeRadius: "soft",
        themeDepth: "elevated",
        logoUrl: "https://example.com/logo.png",
        coverImage: "",
        links: JSON.stringify([{ label: "Docs", url: "https://example.com" }]),
      })
    ).toEqual({ ok: true });
  });

  it("allows empty headingFont (same as body) but not empty font", () => {
    expect(validatePageStylePatch({ headingFont: "" })).toEqual({ ok: true });
    expect(validatePageStylePatch({ font: "" })).toEqual({
      ok: false,
      field: "font",
    });
  });

  it("rejects unknown font keys", () => {
    expect(validatePageStylePatch({ font: "comic-sans" })).toEqual({
      ok: false,
      field: "font",
    });
  });

  it("accepts legacy named accent keys and raw hex, rejects junk", () => {
    expect(validatePageStylePatch({ accentColor: "slate" }).ok).toBe(true);
    expect(validatePageStylePatch({ accentColor: "#a1B2c3" }).ok).toBe(true);
    expect(validatePageStylePatch({ accentColor: "#fff" }).ok).toBe(false);
    expect(
      validatePageStylePatch({ accentColor: "red; background:url(x)" }).ok
    ).toBe(false);
    expect(validatePageStylePatch({ accentColor: 7 }).ok).toBe(false);
  });

  it("rejects invalid enum values", () => {
    expect(validatePageStylePatch({ background: "neon" }).ok).toBe(false);
    expect(validatePageStylePatch({ layoutWidth: "full" }).ok).toBe(false);
    expect(validatePageStylePatch({ tabPlacement: "bottom" }).ok).toBe(false);
    expect(validatePageStylePatch({ coverLayout: "split" }).ok).toBe(false);
    expect(validatePageStylePatch({ coverHeight: "huge" }).ok).toBe(false);
    expect(validatePageStylePatch({ heroLayout: "split" }).ok).toBe(false);
    expect(validatePageStylePatch({ themeRadius: "round" }).ok).toBe(false);
    expect(validatePageStylePatch({ themeDepth: "deep" }).ok).toBe(false);
  });

  it("validates logo/cover URLs", () => {
    expect(validatePageStylePatch({ logoUrl: "" }).ok).toBe(true);
    expect(validatePageStylePatch({ logoUrl: null }).ok).toBe(true);
    expect(
      validatePageStylePatch({ logoUrl: "https://blob.example.com/a.png" }).ok
    ).toBe(true);
    expect(
      validatePageStylePatch({ logoUrl: "javascript:alert(1)" }).ok
    ).toBe(false);
    expect(validatePageStylePatch({ coverImage: "not a url" }).ok).toBe(false);
  });

  it("validates the links JSON payload", () => {
    expect(validatePageStylePatch({ links: "[]" }).ok).toBe(true);
    expect(
      validatePageStylePatch({
        links: JSON.stringify([
          { id: "1", label: "Site", url: "http://example.com" },
        ]),
      }).ok
    ).toBe(true);
    expect(validatePageStylePatch({ links: "not json" }).ok).toBe(false);
    expect(validatePageStylePatch({ links: '{"label":"x"}' }).ok).toBe(false);
    expect(
      validatePageStylePatch({
        links: JSON.stringify([{ label: "x", url: "javascript:alert(1)" }]),
      }).ok
    ).toBe(false);
    expect(
      validatePageStylePatch({
        links: JSON.stringify(
          Array.from({ length: 21 }, (_, i) => ({
            label: `l${i}`,
            url: "https://example.com",
          }))
        ),
      }).ok
    ).toBe(false);
  });

  it("reports the first invalid field", () => {
    expect(
      validatePageStylePatch({ font: "dmsans", background: "nope" })
    ).toEqual({ ok: false, field: "background" });
  });
});
