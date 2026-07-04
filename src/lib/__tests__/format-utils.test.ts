import { describe, it, expect } from "vitest";
import { formatDuration } from "../format-utils";

describe("formatDuration", () => {
  it("returns an em dash for zero or missing durations", () => {
    expect(formatDuration(0)).toBe("—");
  });

  it("formats sub-minute durations as seconds", () => {
    expect(formatDuration(1)).toBe("1s");
    expect(formatDuration(59)).toBe("59s");
  });

  it("formats sub-hour durations as minutes and seconds", () => {
    expect(formatDuration(60)).toBe("1m");
    expect(formatDuration(61)).toBe("1m 1s");
    expect(formatDuration(192)).toBe("3m 12s");
    expect(formatDuration(3599)).toBe("59m 59s");
  });

  it("rolls minutes into hours at one hour and beyond", () => {
    expect(formatDuration(3600)).toBe("1h");
    expect(formatDuration(3660)).toBe("1h 1m");
    expect(formatDuration(10384)).toBe("2h 53m");
  });
});
