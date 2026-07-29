import { describe, it, expect } from "vitest";
import {
  DAY_MS,
  boardMovePatch,
  filterDeals,
  formatDealValue,
  isOverdue,
} from "@/lib/deals";
import type { DealListItem } from "@/types";

const NOW = new Date("2026-07-29T12:00:00Z").getTime();

function deal(overrides: Partial<DealListItem> = {}): DealListItem {
  return {
    id: "deal-1",
    name: "Acme Renewal",
    company: "Acme Inc.",
    value: 12500,
    stage: "NEW",
    status: "OPEN",
    expectedCloseDate: null,
    closedAt: null,
    owner: { id: "user-1", name: "Deals", lastName: "Tester", avatarUrl: "" },
    pages: [],
    stakeholderCount: 0,
    engagement: { lastActivityAt: null, intent: null, topScore: 0 },
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

const daysFromNow = (days: number) =>
  new Date(NOW + days * DAY_MS).toISOString();

describe("boardMovePatch", () => {
  it("moves an open deal between stages", () => {
    expect(boardMovePatch({ stage: "NEW", status: "OPEN" }, "QUALIFIED")).toEqual({
      stage: "QUALIFIED",
    });
  });

  it("is a no-op when dropped on its own stage", () => {
    expect(boardMovePatch({ stage: "NEW", status: "OPEN" }, "NEW")).toBeNull();
  });

  it("marks won/lost when dropped on a terminal column", () => {
    expect(boardMovePatch({ stage: "PROPOSAL", status: "OPEN" }, "WON")).toEqual({
      status: "WON",
    });
    expect(boardMovePatch({ stage: "PROPOSAL", status: "OPEN" }, "LOST")).toEqual({
      status: "LOST",
    });
  });

  it("is a no-op when a closed deal is dropped on its own status column", () => {
    expect(boardMovePatch({ stage: "PROPOSAL", status: "WON" }, "WON")).toBeNull();
  });

  it("flips a won deal to lost directly", () => {
    expect(boardMovePatch({ stage: "PROPOSAL", status: "WON" }, "LOST")).toEqual({
      status: "LOST",
    });
  });

  it("reopens a closed deal dropped onto a stage column", () => {
    expect(boardMovePatch({ stage: "PROPOSAL", status: "LOST" }, "QUALIFIED")).toEqual(
      { status: "OPEN", stage: "QUALIFIED" }
    );
  });
});

describe("isOverdue", () => {
  it("is not overdue on the close date itself (due today ≠ late)", () => {
    expect(isOverdue(deal({ expectedCloseDate: daysFromNow(-0.4) }), NOW)).toBe(false);
  });

  it("turns overdue the day after the close date", () => {
    expect(isOverdue(deal({ expectedCloseDate: daysFromNow(-1.5) }), NOW)).toBe(true);
  });

  it("never flags closed deals or deals without a date", () => {
    expect(
      isOverdue(deal({ expectedCloseDate: daysFromNow(-10), status: "WON" }), NOW)
    ).toBe(false);
    expect(isOverdue(deal(), NOW)).toBe(false);
  });
});

describe("filterDeals", () => {
  const hot = deal({
    id: "hot",
    name: "Globex Pilot",
    company: "Globex",
    engagement: { lastActivityAt: daysFromNow(-1), intent: "High Intent", topScore: 80 },
    expectedCloseDate: daysFromNow(10),
  });
  const cold = deal({
    id: "cold",
    engagement: { lastActivityAt: daysFromNow(-20), intent: "Cold", topScore: 10 },
    expectedCloseDate: daysFromNow(-3),
  });
  const quiet = deal({ id: "quiet", name: "Initech", company: "Initech Corp" });
  const wonAtProposal = deal({
    id: "won",
    status: "WON",
    stage: "PROPOSAL",
    closedAt: daysFromNow(-2),
  });
  const all = [hot, cold, quiet, wonAtProposal];

  it("passes everything through with no filters", () => {
    expect(filterDeals(all, {}, NOW)).toHaveLength(4);
  });

  it("matches search against name and company, case-insensitive", () => {
    expect(filterDeals(all, { query: "globex" }, NOW).map((d) => d.id)).toEqual(["hot"]);
    expect(filterDeals(all, { query: "CORP" }, NOW).map((d) => d.id)).toEqual(["quiet"]);
  });

  it("filters by warmth, including the no-activity bucket", () => {
    expect(filterDeals(all, { warmth: "high" }, NOW).map((d) => d.id)).toEqual(["hot"]);
    // Both quiet and the closed deal have no buyer activity.
    expect(filterDeals(all, { warmth: "none" }, NOW).map((d) => d.id)).toEqual([
      "quiet",
      "won",
    ]);
  });

  it("filters by close date: overdue, due-soon (includes overdue), no date", () => {
    expect(filterDeals(all, { closeDate: "overdue" }, NOW).map((d) => d.id)).toEqual([
      "cold",
    ]);
    expect(filterDeals(all, { closeDate: "soon" }, NOW).map((d) => d.id)).toEqual([
      "hot",
      "cold",
    ]);
    expect(filterDeals(all, { closeDate: "none" }, NOW).map((d) => d.id)).toEqual([
      "quiet",
      "won",
    ]);
  });

  it("excludes deals due beyond the 30-day window", () => {
    const far = deal({ id: "far", expectedCloseDate: daysFromNow(45) });
    expect(filterDeals([far], { closeDate: "soon" }, NOW)).toHaveLength(0);
  });

  it("filters by owner, status, and stage together", () => {
    expect(
      filterDeals(all, { status: "WON", stage: "PROPOSAL" }, NOW).map((d) => d.id)
    ).toEqual(["won"]);
    expect(filterDeals(all, { ownerId: "user-2" }, NOW)).toHaveLength(0);
  });
});

describe("formatDealValue", () => {
  it("formats whole USD with grouping", () => {
    expect(formatDealValue(12500)).toBe("$12,500");
  });

  it("renders a dash when unset", () => {
    expect(formatDealValue(null)).toBe("—");
    expect(formatDealValue(undefined)).toBe("—");
  });

  it("keeps zero as an explicit value", () => {
    expect(formatDealValue(0)).toBe("$0");
  });
});
