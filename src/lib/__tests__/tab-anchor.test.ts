import { describe, expect, it } from "vitest";
import { buildTabAnchors, slugifyTabName, tabIdForHash } from "../tab-anchor";

describe("slugifyTabName", () => {
  it("lowercases, strips accents and punctuation, collapses separators", () => {
    expect(slugifyTabName("Pricing & Terms")).toBe("pricing-terms");
    expect(slugifyTabName("  Next Steps  ")).toBe("next-steps");
    expect(slugifyTabName("Résumé — Q3")).toBe("resume-q3");
    expect(slugifyTabName("🔥 Launch")).toBe("launch");
  });

  it("caps very long names", () => {
    expect(slugifyTabName("a".repeat(100))).toHaveLength(60);
  });
});

describe("buildTabAnchors", () => {
  it("gives every tab a unique, readable anchor", () => {
    const anchors = buildTabAnchors([
      { id: "t1", name: "Overview" },
      { id: "t2", name: "Pricing" },
      { id: "t3", name: "Pricing" },
      { id: "t4", name: "🎉" },
      { id: "t5", name: "" },
    ]);
    expect([...anchors.values()]).toEqual([
      "overview",
      "pricing",
      "pricing-2",
      "section-4",
      "section-5",
    ]);
  });
});

describe("tabIdForHash", () => {
  const anchors = buildTabAnchors([
    { id: "t1", name: "Overview" },
    { id: "t2", name: "Pricing & Terms" },
  ]);

  it("resolves with or without the leading hash, case-insensitively", () => {
    expect(tabIdForHash("#pricing-terms", anchors)).toBe("t2");
    expect(tabIdForHash("Pricing-Terms", anchors)).toBe("t2");
    expect(tabIdForHash("#PRICING%2DTERMS", anchors)).toBe("t2");
  });

  it("ignores unknown or empty hashes", () => {
    expect(tabIdForHash("", anchors)).toBeNull();
    expect(tabIdForHash("#", anchors)).toBeNull();
    expect(tabIdForHash("#nope", anchors)).toBeNull();
    expect(tabIdForHash("#%E0%A4%A", anchors)).toBeNull(); // malformed escape
  });
});
