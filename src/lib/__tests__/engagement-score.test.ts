import { describe, it, expect } from "vitest";
import {
  computeSessionScore,
  aggregateVisitorScore,
  getIntentLabel,
  isPricingTabName,
  type SessionScoreInput,
} from "@/lib/engagement-score";

function input(overrides: Partial<SessionScoreInput> = {}): SessionScoreInput {
  return {
    uniqueTabsViewed: 0,
    pricingTabViewed: false,
    ctaClicked: false,
    fileDownloaded: false,
    isReturn: false,
    durationSeconds: 0,
    totalSessions: 1,
    ...overrides,
  };
}

describe("computeSessionScore", () => {
  it("gives the base 10 for just arriving", () => {
    expect(computeSessionScore(input())).toBe(10);
  });

  it("adds 5 per unique tab, capped at 4 tabs", () => {
    expect(computeSessionScore(input({ uniqueTabsViewed: 2 }))).toBe(20);
    expect(computeSessionScore(input({ uniqueTabsViewed: 4 }))).toBe(30);
    expect(computeSessionScore(input({ uniqueTabsViewed: 9 }))).toBe(30);
  });

  it("replaces the pricing tab's flat +5 with +15", () => {
    // 1 tab which is pricing: base 10 + 15 (no flat +5)
    expect(
      computeSessionScore(input({ uniqueTabsViewed: 1, pricingTabViewed: true }))
    ).toBe(25);
    // 3 tabs, one pricing: base 10 + 2*5 + 15
    expect(
      computeSessionScore(input({ uniqueTabsViewed: 3, pricingTabViewed: true }))
    ).toBe(35);
  });

  it("scores actions and loyalty signals", () => {
    expect(computeSessionScore(input({ ctaClicked: true }))).toBe(30);
    expect(computeSessionScore(input({ fileDownloaded: true }))).toBe(30);
    expect(computeSessionScore(input({ isReturn: true }))).toBe(20);
    expect(computeSessionScore(input({ durationSeconds: 180 }))).toBe(20);
    expect(computeSessionScore(input({ durationSeconds: 179 }))).toBe(10);
    expect(computeSessionScore(input({ totalSessions: 2 }))).toBe(25);
  });

  it("caps at 100", () => {
    const maxed = computeSessionScore(
      input({
        uniqueTabsViewed: 5,
        pricingTabViewed: true,
        ctaClicked: true,
        fileDownloaded: true,
        isReturn: true,
        durationSeconds: 600,
        totalSessions: 3,
      })
    );
    expect(maxed).toBe(100);
  });
});

describe("aggregateVisitorScore", () => {
  it("returns 0 for no sessions", () => {
    expect(aggregateVisitorScore([])).toBe(0);
  });

  it("uses the max session score plus 5 per extra session, bonus capped at 15", () => {
    expect(aggregateVisitorScore([40])).toBe(40);
    expect(aggregateVisitorScore([40, 20])).toBe(45);
    expect(aggregateVisitorScore([40, 20, 10, 10, 10])).toBe(55); // bonus capped at 15
  });

  it("caps the total at 100", () => {
    expect(aggregateVisitorScore([98, 90, 90, 90])).toBe(100);
  });
});

describe("getIntentLabel", () => {
  it("labels by score thresholds", () => {
    expect(getIntentLabel(70, false, false)).toBe("High Intent");
    expect(getIntentLabel(69, false, false)).toBe("Warm");
    expect(getIntentLabel(30, false, false)).toBe("Warm");
    expect(getIntentLabel(29, false, false)).toBe("Cold");
  });

  it("CTA click or pricing view overrides a low score", () => {
    expect(getIntentLabel(0, true, false)).toBe("High Intent");
    expect(getIntentLabel(0, false, true)).toBe("High Intent");
  });
});

describe("isPricingTabName", () => {
  it("matches pricing-ish names case-insensitively", () => {
    expect(isPricingTabName("Pricing")).toBe(true);
    expect(isPricingTabName("Our prices")).toBe(true);
    expect(isPricingTabName("PRICING & PLANS")).toBe(true);
  });

  it("rejects unrelated names", () => {
    expect(isPricingTabName("Overview")).toBe(false);
    expect(isPricingTabName("")).toBe(false);
  });
});
