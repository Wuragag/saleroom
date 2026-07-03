/**
 * Visible-time tracker — pure, framework-free accounting of "true attention
 * time": seconds elapsed while the page was actually visible.
 *
 * Both analytics trackers share this so page-view duration and buyer-session
 * duration agree. `now` is injectable for tests.
 */

export interface VisibleTimeTracker {
  /** Signal a visibility transition. Idempotent — repeated same-state calls are safe. */
  setVisible(visible: boolean): void;
  /** Total visible seconds so far, including the current stretch if visible. */
  getSeconds(): number;
}

export function createVisibleTimeTracker(options?: {
  now?: () => number;
  initiallyVisible?: boolean;
}): VisibleTimeTracker {
  const now = options?.now ?? Date.now;
  let visible = options?.initiallyVisible ?? true;
  let accumulatedMs = 0;
  let stretchStartedAt = visible ? now() : 0;

  return {
    setVisible(next: boolean) {
      if (next === visible) return;
      if (visible) {
        // visible → hidden: close out the current stretch
        accumulatedMs += now() - stretchStartedAt;
      } else {
        // hidden → visible: open a new stretch
        stretchStartedAt = now();
      }
      visible = next;
    },

    getSeconds() {
      const liveMs = visible ? now() - stretchStartedAt : 0;
      return Math.round((accumulatedMs + liveMs) / 1000);
    },
  };
}
