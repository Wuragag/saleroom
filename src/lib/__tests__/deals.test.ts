import { describe, it, expect } from "vitest";
import { boardMovePatch, formatDealValue } from "@/lib/deals";

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
