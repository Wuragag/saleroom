import { describe, it, expect } from "vitest";
import { createVisibleTimeTracker } from "@/lib/visible-time";

function fakeClock(start = 0) {
  let t = start;
  return {
    now: () => t,
    advance(ms: number) {
      t += ms;
    },
  };
}

describe("createVisibleTimeTracker", () => {
  it("counts time while visible, including the live stretch", () => {
    const clock = fakeClock();
    const tracker = createVisibleTimeTracker({ now: clock.now });
    clock.advance(10_000);
    expect(tracker.getSeconds()).toBe(10);
  });

  it("excludes hidden time", () => {
    const clock = fakeClock();
    const tracker = createVisibleTimeTracker({ now: clock.now });
    clock.advance(10_000);
    tracker.setVisible(false);
    clock.advance(60_000); // hidden for a minute — must not count
    tracker.setVisible(true);
    clock.advance(5_000);
    expect(tracker.getSeconds()).toBe(15);
  });

  it("captures the visible stretch at the moment of hiding (the original bug)", () => {
    const clock = fakeClock();
    const tracker = createVisibleTimeTracker({ now: clock.now });
    clock.advance(10_000);
    tracker.setVisible(false); // reading right after hide must include the 10s
    expect(tracker.getSeconds()).toBe(10);
  });

  it("is idempotent for repeated same-state transitions", () => {
    const clock = fakeClock();
    const tracker = createVisibleTimeTracker({ now: clock.now });
    clock.advance(4_000);
    tracker.setVisible(false);
    tracker.setVisible(false); // duplicate hide must not double-accumulate
    clock.advance(4_000);
    tracker.setVisible(true);
    tracker.setVisible(true); // duplicate show must not reset the stretch
    clock.advance(3_000);
    expect(tracker.getSeconds()).toBe(7);
  });

  it("starts hidden when initiallyVisible is false", () => {
    const clock = fakeClock();
    const tracker = createVisibleTimeTracker({ now: clock.now, initiallyVisible: false });
    clock.advance(30_000);
    expect(tracker.getSeconds()).toBe(0);
    tracker.setVisible(true);
    clock.advance(2_000);
    expect(tracker.getSeconds()).toBe(2);
  });

  it("is monotonic", () => {
    const clock = fakeClock();
    const tracker = createVisibleTimeTracker({ now: clock.now });
    let last = 0;
    for (let i = 0; i < 5; i++) {
      clock.advance(1_000);
      if (i === 2) tracker.setVisible(false);
      if (i === 3) tracker.setVisible(true);
      const s = tracker.getSeconds();
      expect(s).toBeGreaterThanOrEqual(last);
      last = s;
    }
  });
});
