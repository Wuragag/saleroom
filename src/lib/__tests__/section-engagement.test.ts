import { describe, it, expect } from "vitest";
import {
  aggregateSections,
  mergeWithPageTabs,
  type SectionEngagement,
  type SectionSessionInput,
} from "@/lib/section-engagement";

describe("aggregateSections", () => {
  it("returns an empty array for no sessions", () => {
    expect(aggregateSections([])).toEqual([]);
  });

  it("sums dwell time and view counts for a tab across sessions", () => {
    const sessions: SectionSessionInput[] = [
      { tabViews: [{ tabId: "t1", tabName: "Pricing", duration: 120, viewCount: 2 }], scrollEvents: [] },
      { tabViews: [{ tabId: "t1", tabName: "Pricing", duration: 80, viewCount: 1 }], scrollEvents: [] },
    ];
    const [pricing] = aggregateSections(sessions);
    expect(pricing.durationSeconds).toBe(200);
    expect(pricing.viewCount).toBe(3);
    expect(pricing.sharePct).toBe(100);
  });

  it("orders sections by dwell time and computes share of total", () => {
    const sessions: SectionSessionInput[] = [
      {
        tabViews: [
          { tabId: "t1", tabName: "Overview", duration: 40, viewCount: 1 },
          { tabId: "t2", tabName: "Pricing", duration: 120, viewCount: 1 },
          { tabId: "t3", tabName: "Proposal", duration: 40, viewCount: 1 },
        ],
        scrollEvents: [],
      },
    ];
    const sections = aggregateSections(sessions);
    expect(sections.map((s) => s.tabName)).toEqual(["Pricing", "Overview", "Proposal"]);
    expect(sections[0].sharePct).toBe(60); // 120 / 200
    expect(sections[1].sharePct).toBe(20);
  });

  it("takes the deepest scroll per tab and ignores untagged scroll", () => {
    const sessions: SectionSessionInput[] = [
      {
        tabViews: [{ tabId: "t1", tabName: "Pricing", duration: 60, viewCount: 1 }],
        scrollEvents: [
          { tabId: "t1", depth: 25 },
          { tabId: "t1", depth: 75 },
          { tabId: null, depth: 100 }, // untagged (legacy) — must not attach to any tab
          { tabId: "t2", depth: 50 }, // tab with no dwell row — ignored
        ],
      },
    ];
    const [pricing] = aggregateSections(sessions);
    expect(pricing.maxScrollPct).toBe(75);
    expect(aggregateSections(sessions)).toHaveLength(1);
  });

  it("reports 0 scroll for sessions with no scroll data (graceful fallback)", () => {
    const sessions: SectionSessionInput[] = [
      { tabViews: [{ tabId: "t1", tabName: "Docs", duration: 30, viewCount: 1 }], scrollEvents: [] },
    ];
    expect(aggregateSections(sessions)[0].maxScrollPct).toBe(0);
  });

  it("clamps out-of-range scroll depths", () => {
    const sessions: SectionSessionInput[] = [
      {
        tabViews: [{ tabId: "t1", tabName: "Docs", duration: 30, viewCount: 1 }],
        scrollEvents: [{ tabId: "t1", depth: 250 }],
      },
    ];
    expect(aggregateSections(sessions)[0].maxScrollPct).toBe(100);
  });

  it("falls back to a placeholder name for blank tab names", () => {
    const sessions: SectionSessionInput[] = [
      { tabViews: [{ tabId: "t1", tabName: "", duration: 10, viewCount: 1 }], scrollEvents: [] },
    ];
    expect(aggregateSections(sessions)[0].tabName).toBe("Untitled");
  });
});

describe("mergeWithPageTabs", () => {
  const section = (tabId: string, tabName: string, durationSeconds: number): SectionEngagement => ({
    tabId,
    tabName,
    durationSeconds,
    viewCount: 1,
    sharePct: 50,
    maxScrollPct: 0,
  });

  it("returns rows in deck (tab) order, not dwell order", () => {
    const sections = [section("t2", "Pricing", 120), section("t1", "Overview", 40)];
    const tabs = [
      { id: "t1", name: "Overview" },
      { id: "t2", name: "Pricing" },
    ];
    expect(mergeWithPageTabs(sections, tabs).map((s) => s.tabName)).toEqual([
      "Overview",
      "Pricing",
    ]);
  });

  it("zero-fills tabs no buyer has opened", () => {
    const tabs = [
      { id: "t1", name: "Overview" },
      { id: "t2", name: "Next Steps" },
    ];
    const merged = mergeWithPageTabs([section("t1", "Overview", 40)], tabs);
    expect(merged).toHaveLength(2);
    expect(merged[1]).toMatchObject({
      tabId: "t2",
      tabName: "Next Steps",
      durationSeconds: 0,
      viewCount: 0,
      sharePct: 0,
    });
  });

  it("prefers the live tab name over the recorded one (renamed tabs)", () => {
    const tabs = [{ id: "t1", name: "Investment" }];
    const merged = mergeWithPageTabs([section("t1", "Pricing", 40)], tabs);
    expect(merged[0].tabName).toBe("Investment");
    expect(merged[0].durationSeconds).toBe(40);
  });

  it("appends engagement for deleted tabs after live ones, keeping their data", () => {
    const tabs = [{ id: "t1", name: "Overview" }];
    const merged = mergeWithPageTabs(
      [section("t9", "Old Pricing", 300), section("t1", "Overview", 40)],
      tabs
    );
    expect(merged.map((s) => s.tabId)).toEqual(["t1", "t9"]);
    expect(merged[1].tabName).toBe("Old Pricing");
    expect(merged[1].durationSeconds).toBe(300);
  });

  it("handles an empty tab list and no engagement", () => {
    expect(mergeWithPageTabs([], [])).toEqual([]);
  });
});
