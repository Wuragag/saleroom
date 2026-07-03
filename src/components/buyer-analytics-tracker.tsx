"use client";

/**
 * BuyerAnalyticsTracker
 *
 * Invisible client component mounted on every published page.
 * Responsibilities:
 *  - Generate / restore a visitor UUID from localStorage
 *  - Start / resume a buyer session (POST /api/buyer/session)
 *  - Track tab views via the `sr:tab_view` custom DOM event
 *  - Track scroll depth (25 / 50 / 75 / 100%)
 *  - Track CTA clicks (buttons + links containing "cta" data-attr or containing "Book" / "Demo" / "Start" text)
 *  - Batch-flush events every 10s + on visibilitychange (hidden)
 *  - Send heartbeat PATCH every 30s + on visibilitychange (hidden)
 */

import { useEffect, useRef } from "react";
import { createVisibleTimeTracker, type VisibleTimeTracker } from "@/lib/visible-time";
import { isPricingTabName } from "@/lib/engagement-score";

const SESSION_API = "/api/buyer/session";
const EVENTS_API  = "/api/buyer/events";

const HEARTBEAT_INTERVAL_MS = 60_000;

function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    const stored = localStorage.getItem("sr_visitor_id");
    if (stored) return stored;
    const id = crypto.randomUUID();
    localStorage.setItem("sr_visitor_id", id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

interface TabViewState {
  tabId: string;
  tabName: string;
  startedAt: number; // Date.now()
  duration: number;  // ms accumulated so far
  viewCount: number;
}

interface PendingEvent {
  type: string;
  metadata?: Record<string, unknown>;
}

interface Props {
  pageId: string;
  initialTabId?: string;
  initialTabName?: string;
  refToken?: string;
}

export function BuyerAnalyticsTracker({ pageId, initialTabId, initialTabName, refToken }: Props) {
  // Refs are stable across renders — no re-renders needed for tracker state
  const sessionIdRef   = useRef<string | null>(null);
  // Visible-time only — hidden/background time doesn't count as engagement
  const visibleTimeRef = useRef<VisibleTimeTracker | null>(null);
  // Seconds already accumulated by a resumed session (seeded from the server)
  const baseDurationRef = useRef(0);
  const hiddenRef      = useRef(false);
  const tabViewsRef    = useRef<Map<string, TabViewState>>(new Map());
  const activeTabRef   = useRef<{ id: string; name: string } | null>(
    initialTabId ? { id: initialTabId, name: initialTabName ?? "" } : null
  );
  const pendingEvents  = useRef<PendingEvent[]>([]);
  const ctaClickedRef  = useRef(false);
  const pricingTabRef  = useRef(false);
  const fileDownloaded = useRef(false);
  const scrollDepth    = useRef(0);
  const scrollDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── helpers ──────────────────────────────────────────────────────────────
  // All helpers are stored in a stable ref so that setInterval / addEventListener
  // callbacks always call the latest version, avoiding stale-closure bugs if
  // props or ref wiring ever changes.

  const helpersRef = useRef({
    queueEvent(type: string, metadata?: Record<string, unknown>) {
      pendingEvents.current.push({ type, metadata });
    },

    currentDurationSeconds(): number {
      return baseDurationRef.current + (visibleTimeRef.current?.getSeconds() ?? 0);
    },

    /** Close out the active tab's running stretch (no-op while hidden). */
    accrueActiveTab() {
      const now = Date.now();
      const active = activeTabRef.current;
      if (!active || hiddenRef.current) return;
      const entry = tabViewsRef.current.get(active.id);
      if (entry) {
        entry.duration += now - entry.startedAt;
        entry.startedAt = now;
      }
    },

    /** Pause/resume tab-time accrual on visibility changes. */
    setPageVisible(visible: boolean) {
      if (visible === !hiddenRef.current) return;
      const h = helpersRef.current;
      if (!visible) {
        h.accrueActiveTab(); // capture the stretch before pausing
        hiddenRef.current = true;
      } else {
        hiddenRef.current = false;
        const active = activeTabRef.current;
        const entry = active ? tabViewsRef.current.get(active.id) : undefined;
        if (entry) entry.startedAt = Date.now();
      }
      visibleTimeRef.current?.setVisible(visible);
    },

    buildTabViewsPayload() {
      helpersRef.current.accrueActiveTab();
      return [...tabViewsRef.current.values()].map((tv) => ({
        tabId:     tv.tabId,
        tabName:   tv.tabName,
        duration:  Math.round(tv.duration / 1000),
        viewCount: tv.viewCount,
      }));
    },

    startOrSwitchTab(tabId: string, tabName: string) {
      const now = Date.now();
      const map = tabViewsRef.current;

      helpersRef.current.accrueActiveTab();

      const existing = map.get(tabId);
      if (existing) {
        existing.viewCount++;
        existing.startedAt = now;
      } else {
        map.set(tabId, { tabId, tabName, startedAt: now, duration: 0, viewCount: 1 });
      }

      if (isPricingTabName(tabName)) {
        pricingTabRef.current = true;
      }

      activeTabRef.current = { id: tabId, name: tabName };
      // Scroll depth is per-section: reset milestones so the new tab tracks its
      // own scroll independently of the previous one.
      scrollDepth.current = 0;
    },

    async flushEvents() {
      if (!sessionIdRef.current) return;
      const batch = pendingEvents.current.splice(0);
      if (batch.length === 0) return;
      try {
        await fetch(EVENTS_API, {
          method:    "POST",
          keepalive: true,
          headers:   { "Content-Type": "application/json" },
          body:      JSON.stringify({ sessionId: sessionIdRef.current, events: batch }),
        });
      } catch {/* non-critical */}
    },

    async sendHeartbeat() {
      if (!sessionIdRef.current) return;
      const h = helpersRef.current;
      const tabViews = h.buildTabViewsPayload();
      try {
        await fetch(`${SESSION_API}/${sessionIdRef.current}`, {
          method:    "PATCH",
          keepalive: true,
          headers:   { "Content-Type": "application/json" },
          body:      JSON.stringify({
            duration:         h.currentDurationSeconds(),
            tabViews,
            ctaClicked:       ctaClickedRef.current,
            pricingTabViewed: pricingTabRef.current,
            fileDownloaded:   fileDownloaded.current,
          }),
        });
      } catch {/* non-critical */}
    },
  });

  // ── effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    // Guard against StrictMode double-invoke
    let aborted = false;

    if (!visibleTimeRef.current) {
      visibleTimeRef.current = createVisibleTimeTracker({
        initiallyVisible: document.visibilityState !== "hidden",
      });
      hiddenRef.current = document.visibilityState === "hidden";
    }

    async function init() {
      const visitorId = getOrCreateVisitorId();
      if (!visitorId || aborted) return;

      try {
        const res = await fetch(SESSION_API, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ visitorId, pageId, ...(refToken ? { refToken } : {}) }),
        });
        if (!res.ok || aborted) return;
        const data = await res.json();
        if (aborted) return;
        sessionIdRef.current = data.sessionId;

        const h = helpersRef.current;

        // Resumed session: seed accumulated state so heartbeats keep sending
        // absolute totals instead of restarting from zero (which used to
        // clobber the earlier data server-side).
        if (data.resumed) {
          baseDurationRef.current = Number(data.duration) || 0;
          const seeded: Array<{ tabId: string; tabName: string; duration: number; viewCount: number }> =
            Array.isArray(data.tabViews) ? data.tabViews : [];
          const now = Date.now();
          for (const tv of seeded) {
            if (tabViewsRef.current.has(tv.tabId)) continue;
            tabViewsRef.current.set(tv.tabId, {
              tabId:     tv.tabId,
              tabName:   tv.tabName,
              startedAt: now,
              duration:  (Number(tv.duration) || 0) * 1000,
              viewCount: Number(tv.viewCount) || 1,
            });
            if (isPricingTabName(tv.tabName)) pricingTabRef.current = true;
          }
        }

        // Record initial tab view
        if (initialTabId) {
          h.startOrSwitchTab(initialTabId, initialTabName ?? "");
        }

        h.queueEvent("PAGE_LOAD", { isReturn: data.isReturn });
      } catch {/* silent */}
    }

    init();
    return () => { aborted = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  // Tab switch listener
  useEffect(() => {
    function onTabView(e: Event) {
      const { tabId, tabName } = (e as CustomEvent).detail;
      const h = helpersRef.current;
      h.startOrSwitchTab(tabId, tabName);
      h.queueEvent("TAB_VIEW", { tabId, tabName });
    }
    window.addEventListener("sr:tab_view", onTabView);
    return () => window.removeEventListener("sr:tab_view", onTabView);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll depth tracker
  useEffect(() => {
    function onScroll() {
      if (scrollDebounce.current) clearTimeout(scrollDebounce.current);
      scrollDebounce.current = setTimeout(() => {
        const el  = document.documentElement;
        const pct = Math.round(((el.scrollTop + el.clientHeight) / el.scrollHeight) * 100);
        const milestones = [25, 50, 75, 100] as const;
        const active = activeTabRef.current;
        for (const m of milestones) {
          if (pct >= m && scrollDepth.current < m) {
            scrollDepth.current = m;
            helpersRef.current.queueEvent(`SCROLL_${m}`, {
              depth: m,
              tabId: active?.id ?? null,
              tabName: active?.name ?? null,
            });
          }
        }
      }, 300);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollDebounce.current) clearTimeout(scrollDebounce.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // CTA click tracker
  useEffect(() => {
    const CTA_KEYWORDS = /\b(book|demo|start|get started|contact|buy|purchase|sign up|try)\b/i;

    function onDocClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest("a, button");
      if (!target) return;
      const text = target.textContent ?? "";
      const isCta =
        target.hasAttribute("data-cta") ||
        CTA_KEYWORDS.test(text) ||
        target.closest("[data-cta]") !== null;

      const h = helpersRef.current;
      if (isCta) {
        ctaClickedRef.current = true;
        h.queueEvent("CTA_CLICK", { text: text.trim().slice(0, 80) });
      } else if (target.tagName === "A") {
        const rawHref = (target as HTMLAnchorElement).href ?? "";
        const isFile = /\.(pdf|docx?|xlsx?|pptx?|zip|csv)(\?|$)/i.test(rawHref);
        // Strip query/fragment — they can carry tokens, emails, and other PII
        let href = rawHref;
        try {
          const u = new URL(rawHref);
          u.search = "";
          u.hash = "";
          href = u.toString();
        } catch {}
        if (isFile) {
          fileDownloaded.current = true;
          h.queueEvent("FILE_DOWNLOAD", { href: href.slice(0, 200) });
        } else {
          h.queueEvent("LINK_CLICK", { href: href.slice(0, 200), text: text.trim().slice(0, 60) });
        }
      }
    }

    document.addEventListener("click", onDocClick, { passive: true });
    return () => document.removeEventListener("click", onDocClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Heartbeat + flush intervals
  useEffect(() => {
    // Single interval for both heartbeat + event flush to minimize DB operations
    const heartbeatTimer = setInterval(() => {
      helpersRef.current.flushEvents();
      helpersRef.current.sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    function onVisibilityChange() {
      const visible = document.visibilityState !== "hidden";
      helpersRef.current.setPageVisible(visible);
      if (!visible) {
        helpersRef.current.flushEvents();
        helpersRef.current.sendHeartbeat();
      }
    }

    // pagehide catches navigations/closures that never fire visibilitychange
    // (and beforeunload doesn't exist on mobile Safari)
    function onPageHide() {
      helpersRef.current.setPageVisible(false);
      helpersRef.current.flushEvents();
      helpersRef.current.sendHeartbeat();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      clearInterval(heartbeatTimer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      // Final flush on unmount
      helpersRef.current.flushEvents();
      helpersRef.current.sendHeartbeat();
    };
  }, []);

  return null; // purely behavioral, no UI
}
