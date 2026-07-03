/**
 * Section (per-tab) engagement aggregation — pure, no DB access.
 *
 * Rolls a visitor's sessions up into per-section engagement: how long they
 * spent in each tab, how many times they opened it, that tab's share of their
 * total time, and the deepest they scrolled within it.
 *
 * Dwell time and view counts come from BuyerTabView rows and are accurate for
 * all historical data. Scroll depth comes from SCROLL_* BuyerEvents tagged with
 * the active tab; it reads 0 for sessions recorded before per-section scroll
 * tagging existed (graceful fallback, never a wrong number).
 */

export interface SectionTabViewInput {
  tabId: string;
  tabName: string;
  duration: number; // seconds
  viewCount: number;
}

export interface SectionScrollInput {
  tabId: string | null;
  depth: number; // 0–100
}

export interface SectionSessionInput {
  tabViews: SectionTabViewInput[];
  scrollEvents: SectionScrollInput[];
}

export interface SectionEngagement {
  tabId: string;
  tabName: string;
  durationSeconds: number;
  viewCount: number;
  sharePct: number; // share of the visitor's total section time (0–100)
  maxScrollPct: number; // deepest scroll within this section (0 if unknown)
}

export function aggregateSections(
  sessions: SectionSessionInput[]
): SectionEngagement[] {
  const byTab = new Map<
    string,
    { tabName: string; duration: number; viewCount: number; maxScroll: number }
  >();

  for (const session of sessions) {
    for (const tv of session.tabViews) {
      const existing = byTab.get(tv.tabId);
      if (existing) {
        existing.duration += tv.duration;
        existing.viewCount += tv.viewCount;
        // A later tab name wins only if the earlier one was blank
        if (!existing.tabName && tv.tabName) existing.tabName = tv.tabName;
      } else {
        byTab.set(tv.tabId, {
          tabName: tv.tabName,
          duration: tv.duration,
          viewCount: tv.viewCount,
          maxScroll: 0,
        });
      }
    }

    for (const ev of session.scrollEvents) {
      if (!ev.tabId) continue;
      const entry = byTab.get(ev.tabId);
      if (entry) {
        entry.maxScroll = Math.max(entry.maxScroll, clampPct(ev.depth));
      }
    }
  }

  const totalDuration = [...byTab.values()].reduce((sum, t) => sum + t.duration, 0);

  return [...byTab.entries()]
    .map(([tabId, t]) => ({
      tabId,
      tabName: t.tabName || "Untitled",
      durationSeconds: t.duration,
      viewCount: t.viewCount,
      sharePct: totalDuration > 0 ? Math.round((t.duration / totalDuration) * 100) : 0,
      maxScrollPct: t.maxScroll,
    }))
    .sort((a, b) => b.durationSeconds - a.durationSeconds);
}

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}
