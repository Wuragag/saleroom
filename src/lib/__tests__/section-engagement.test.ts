import { describe, it, expect } from "vitest";
import { aggregateSections, type SectionSessionInput } from "@/lib/section-engagement";

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
