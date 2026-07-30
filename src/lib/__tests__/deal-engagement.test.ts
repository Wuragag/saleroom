import { describe, it, expect } from "vitest";
import {
  rollupDealEngagement,
  type DealPageEngagement,
} from "@/lib/deal-engagement";

function page(overrides: Partial<DealPageEngagement> = {}): DealPageEngagement {
  return {
    pageId: "page-1",
    lastSeenAt: null,
    topScore: 0,
    visitorCount: 0,
    highIntentCount: 0,
    ...overrides,
  };
}

describe("rollupDealEngagement", () => {
  it("returns an empty pulse for a deal with no linked rooms", () => {
    expect(rollupDealEngagement([])).toEqual({
      lastActivityAt: null,
      intent: null,
      topScore: 0,
    });
  });

  it("returns a null intent when linked rooms have no visitors", () => {
    const res = rollupDealEngagement([page(), page({ pageId: "page-2" })]);
    expect(res.intent).toBeNull();
    expect(res.lastActivityAt).toBeNull();
  });

  it("picks the most recent activity across rooms", () => {
    const older = new Date("2026-07-01T10:00:00Z");
    const newer = new Date("2026-07-20T10:00:00Z");
    const res = rollupDealEngagement([
      page({ lastSeenAt: older, visitorCount: 1 }),
      page({ pageId: "page-2", lastSeenAt: newer, visitorCount: 1 }),
    ]);
    expect(res.lastActivityAt).toEqual(newer);
  });

  it("takes the best stored score across rooms", () => {
    const res = rollupDealEngagement([
      page({ visitorCount: 1, topScore: 25 }),
      page({ pageId: "page-2", visitorCount: 1, topScore: 45 }),
    ]);
    expect(res.topScore).toBe(45);
    expect(res.intent).toBe("Warm");
  });

  it("labels Cold below the warm threshold", () => {
    const res = rollupDealEngagement([page({ visitorCount: 1, topScore: 20 })]);
    expect(res.intent).toBe("Cold");
  });

  it("labels High Intent at a 70+ stored score", () => {
    const res = rollupDealEngagement([page({ visitorCount: 2, topScore: 70 })]);
    expect(res.intent).toBe("High Intent");
  });

  it("forces High Intent when any room has a high-intent visitor, regardless of score", () => {
    const res = rollupDealEngagement([
      page({ visitorCount: 1, topScore: 15 }),
      page({ pageId: "page-2", visitorCount: 1, topScore: 10, highIntentCount: 1 }),
    ]);
    expect(res.intent).toBe("High Intent");
  });

  it("tolerates a room reporting activity without a lastSeenAt", () => {
    // Defensive: a grouped query can surface a visitor row with a null max.
    const res = rollupDealEngagement([
      page({ visitorCount: 1, topScore: 40, lastSeenAt: null }),
    ]);
    expect(res.lastActivityAt).toBeNull();
    expect(res.intent).toBe("Warm");
  });
});
