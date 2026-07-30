import { describe, it, expect } from "vitest";
import {
  DAY_MS,
  boardMovePatch,
  filterDeals,
  formatDealValue,
  formatStageAge,
  isOverdue,
  stageDeleteTarget,
} from "@/lib/deals";
import type { DealListItem } from "@/types";

const NOW = new Date("2026-07-29T12:00:00Z").getTime();

function deal(overrides: Partial<DealListItem> = {}): DealListItem {
  return {
    id: "deal-1",
    name: "Acme Renewal",
    company: { id: "co-acme", name: "Acme Inc." },
    value: 12500,
    stage: { id: "stage-new", name: "New" },
    stageEnteredAt: "2026-07-28T12:00:00.000Z",
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
  it("moves an open deal between stage columns", () => {
    expect(
      boardMovePatch({ stageId: "stage-new", status: "OPEN" }, "stage-qualified")
    ).toEqual({ stageId: "stage-qualified" });
  });

  it("is a no-op when dropped on its own stage", () => {
    expect(
      boardMovePatch({ stageId: "stage-new", status: "OPEN" }, "stage-new")
    ).toBeNull();
  });

  it("marks won/lost when dropped on a terminal column", () => {
    expect(
      boardMovePatch({ stageId: "stage-prop", status: "OPEN" }, "WON")
    ).toEqual({ status: "WON" });
    expect(
      boardMovePatch({ stageId: "stage-prop", status: "OPEN" }, "LOST")
    ).toEqual({ status: "LOST" });
  });

  it("is a no-op when a closed deal is dropped on its own status column", () => {
    expect(boardMovePatch({ stageId: "s", status: "WON" }, "WON")).toBeNull();
  });

  it("flips a won deal to lost directly", () => {
    expect(boardMovePatch({ stageId: "s", status: "WON" }, "LOST")).toEqual({
      status: "LOST",
    });
  });

  it("reopens a closed deal dropped onto a stage column", () => {
    expect(boardMovePatch({ stageId: "s", status: "LOST" }, "stage-q")).toEqual({
      status: "OPEN",
      stageId: "stage-q",
    });
  });
});

describe("stageDeleteTarget", () => {
  const stages = [
    { id: "a", order: 0 },
    { id: "b", order: 1 },
    { id: "c", order: 2 },
  ];

  it("sends deals to the previous column by order", () => {
    expect(stageDeleteTarget(stages, "b")).toBe("a");
    expect(stageDeleteTarget(stages, "c")).toBe("b");
  });

  it("sends the first column's deals to the next one", () => {
    expect(stageDeleteTarget(stages, "a")).toBe("b");
  });

  it("refuses when the stage is missing or the last one left", () => {
    expect(stageDeleteTarget(stages, "nope")).toBeNull();
    expect(stageDeleteTarget([{ id: "a", order: 0 }], "a")).toBeNull();
  });

  it("ignores the input array's ordering", () => {
    const shuffled = [stages[2], stages[0], stages[1]];
    expect(stageDeleteTarget(shuffled, "b")).toBe("a");
  });
});

describe("formatStageAge", () => {
  it("floors to hours under a day, days after", () => {
    expect(formatStageAge(new Date(NOW - 30 * 60 * 1000).toISOString(), NOW)).toBe("<1h");
    expect(formatStageAge(new Date(NOW - 5 * 60 * 60 * 1000).toISOString(), NOW)).toBe("5h");
    expect(formatStageAge(daysFromNow(-3), NOW)).toBe("3d");
  });

  it("clamps future timestamps to zero", () => {
    expect(formatStageAge(daysFromNow(1), NOW)).toBe("<1h");
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
    company: { id: "co-globex", name: "Globex" },
    engagement: { lastActivityAt: daysFromNow(-1), intent: "High Intent", topScore: 80 },
    expectedCloseDate: daysFromNow(10),
  });
  const cold = deal({
    id: "cold",
    engagement: { lastActivityAt: daysFromNow(-20), intent: "Cold", topScore: 10 },
    expectedCloseDate: daysFromNow(-3),
  });
  const quiet = deal({
    id: "quiet",
    name: "Initech",
    company: { id: "co-initech", name: "Initech Corp" },
  });
  const wonAtProposal = deal({
    id: "won",
    status: "WON",
    stage: { id: "stage-proposal", name: "Proposal" },
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

  it("filters by owner, status, and stage id together", () => {
    expect(
      filterDeals(all, { status: "WON", stageId: "stage-proposal" }, NOW).map((d) => d.id)
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
