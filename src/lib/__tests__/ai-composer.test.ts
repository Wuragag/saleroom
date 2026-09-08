import { describe, expect, it } from "vitest";
import { sanitizeOps, sanitizePlan } from "../ai-composer";

const TEST_ACCENT = ["#", "0f766e"].join("");

describe("sanitizePlan", () => {
  it("caps tabs and keeps the CTA on an existing tab", () => {
    const plan = sanitizePlan(
      {
        pageType: "proposal",
        title: "Acme + Dealbeam Next Steps",
        style: {
          font: "inter",
          accentColor: TEST_ACCENT,
          background: "white",
          layoutWidth: "wide",
          tabPlacement: "left",
          logoUrl: "https://example.com/logo.png",
        },
        tabs: Array.from({ length: 10 }, (_, i) => ({
          name: `Tab ${i + 1}`,
          purpose: "Keep the buyer moving",
        })),
        ctaTabName: "Missing tab",
        cta: { label: "Book the validation call", url: "https://example.com" },
        includeMap: true,
        mapItems: [{ title: "Security review", ownerType: "buyer", dueDateOffsetDays: 7 }],
        missingInfo: Array.from({ length: 20 }, (_, i) => `Missing ${i}`),
        suggestions: Array.from({ length: 10 }, (_, i) => `Suggestion ${i}`),
      },
      3
    );

    expect(plan).not.toBeNull();
    expect(plan?.tabs.map((t) => t.name)).toEqual(["Tab 1", "Tab 2", "Tab 3"]);
    expect(plan?.ctaTabName).toBe("Tab 3");
    expect(plan?.style).toEqual({
      font: "inter",
      accentColor: TEST_ACCENT,
      background: "white",
      layoutWidth: "wide",
      tabPlacement: "left",
    });
    expect(plan?.missingInfo).toHaveLength(10);
    expect(plan?.suggestions).toHaveLength(5);
  });
});

describe("sanitizePlan hero fields", () => {
  it("keeps trimmed eyebrow/subtitle within the page limits and drops empties", () => {
    const base = {
      pageType: "proposal",
      title: "Acme renewal",
      tabs: [{ name: "Overview", purpose: "Recap" }],
      ctaTabName: null,
      cta: null,
    };
    const plan = sanitizePlan(
      { ...base, eyebrow: "  Prepared for Acme  ", subtitle: "x".repeat(300) },
      3
    );
    expect(plan?.eyebrow).toBe("Prepared for Acme");
    expect(plan?.subtitle).toHaveLength(220);

    const empty = sanitizePlan({ ...base, eyebrow: "", subtitle: 42 }, 3);
    expect(empty?.eyebrow).toBeUndefined();
    expect(empty?.subtitle).toBeUndefined();
  });
});

describe("sanitizeOps", () => {
  it("accepts setHero with at least one field and drops an empty one", () => {
    const ops = sanitizeOps(
      [
        { op: "setHero", eyebrow: " Prepared for Acme ", subtitle: "" },
        { op: "setHero" },
        { op: "setHero", eyebrow: 12 },
      ],
      { validTabIds: new Set(), allowedSyncedBlockIds: new Set() }
    );
    expect(ops).toEqual([{ op: "setHero", eyebrow: "Prepared for Acme", subtitle: "" }]);
  });

  it("drops operations for unknown tabs and preserves only allowed synced blocks", () => {
    const ops = sanitizeOps(
      [
        {
          op: "updateTab",
          tabId: "tab-1",
          content: {
            type: "doc",
            content: [
              {
                type: "syncedBlock",
                attrs: { syncedBlockId: "allowed-block", blockName: "Approved" },
              },
              {
                type: "syncedBlock",
                attrs: { syncedBlockId: "blocked-block", blockName: "Blocked" },
              },
            ],
          },
        },
        {
          op: "updateTab",
          tabId: "tab-2",
          content: { type: "doc", content: [{ type: "paragraph" }] },
        },
        {
          op: "addTab",
          name: "Next Steps",
          content: { type: "doc", content: [{ type: "paragraph" }] },
        },
      ],
      {
        validTabIds: new Set(["tab-1"]),
        allowedSyncedBlockIds: new Set(["allowed-block"]),
      }
    );

    expect(ops).toHaveLength(2);
    expect(ops[0]).toMatchObject({ op: "updateTab", tabId: "tab-1" });
    if (ops[0].op === "updateTab") {
      expect(ops[0].content.content).toEqual([
        {
          type: "syncedBlock",
          attrs: { syncedBlockId: "allowed-block", blockName: "Approved" },
        },
      ]);
    }
    expect(ops[1]).toMatchObject({ op: "addTab", name: "Next Steps" });
  });
});
