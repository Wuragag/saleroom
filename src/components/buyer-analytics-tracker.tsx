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

const SESSION_API = "/api/buyer/session";
const EVENTS_API  = "/api/buyer/events";

const HEARTBEAT_INTERVAL_MS = 30_000;
const FLUSH_INTERVAL_MS     = 10_000;

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
}

export function BuyerAnalyticsTracker({ pageId, initialTabId, initialTabName }: Props) {
  // Refs are stable across renders — no re-renders needed for tracker state
  const sessionIdRef   = useRef<string | null>(null);
  const pageStartRef   = useRef<number>(Date.now());
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

  function queueEvent(type: string, metadata?: Record<string, unknown>) {
    pendingEvents.current.push({ type, metadata });
  }

  function currentDurationSeconds(): number {
    return Math.round((Date.now() - pageStartRef.current) / 1000);
  }

  function buildTabViewsPayload() {
    // Accumulate duration for the currently active tab up to now
    const now = Date.now();
    const map = tabViewsRef.current;
    const active = activeTabRef.current;

    if (active) {
      const entry = map.get(active.id);
      if (entry) {
        // Add time since last startedAt
        entry.duration += now - entry.startedAt;
        entry.startedAt = now; // reset for next heartbeat
      }
    }

    return [...map.values()].map((tv) => ({
      tabId:     tv.tabId,
      tabName:   tv.tabName,
      duration:  Math.round(tv.duration / 1000),
      viewCount: tv.viewCount,
    }));
  }

  function startOrSwitchTab(tabId: string, tabName: string) {
    const now = Date.now();
    const map = tabViewsRef.current;
    const prev = activeTabRef.current;

    // Close out previous tab duration
    if (prev) {
      const prevEntry = map.get(prev.id);
      if (prevEntry) {
        prevEntry.duration += now - prevEntry.startedAt;
        prevEntry.startedAt = now;
      }
    }

    // Start or increment new tab
    const existing = map.get(tabId);
    if (existing) {
      existing.viewCount++;
      existing.startedAt = now;
    } else {
      map.set(tabId, { tabId, tabName, startedAt: now, duration: 0, viewCount: 1 });
    }

    if (tabName.toLowerCase().includes("pric")) {
      pricingTabRef.current = true;
    }

    activeTabRef.current = { id: tabId, name: tabName };
  }

  async function flushEvents() {
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
  }

  async function sendHeartbeat() {
    if (!sessionIdRef.current) return;
    const tabViews = buildTabViewsPayload();
    try {
      await fetch(`${SESSION_API}/${sessionIdRef.current}`, {
        method:    "PATCH",
        keepalive: true,
        headers:   { "Content-Type": "application/json" },
        body:      JSON.stringify({
          duration:       currentDurationSeconds(),
          tabViews,
          ctaClicked:     ctaClickedRef.current,
          pricingTabViewed: pricingTabRef.current,
          fileDownloaded: fileDownloaded.current,
        }),
      });
    } catch {/* non-critical */}
  }

  // ── effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    // Guard against StrictMode double-invoke
    let aborted = false;

    async function init() {
      const visitorId = getOrCreateVisitorId();
      if (!visitorId || aborted) return;

      try {
        const res = await fetch(SESSION_API, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ visitorId, pageId }),
        });
        if (!res.ok || aborted) return;
        const data = await res.json();
        if (aborted) return;
        sessionIdRef.current = data.sessionId;

        // Record initial tab view
        if (initialTabId) {
          startOrSwitchTab(initialTabId, initialTabName ?? "");
        }

        queueEvent("PAGE_LOAD", { isReturn: data.isReturn });
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
      startOrSwitchTab(tabId, tabName);
      queueEvent("TAB_VIEW", { tabId, tabName });
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
        for (const m of milestones) {
          if (pct >= m && scrollDepth.current < m) {
            scrollDepth.current = m;
            queueEvent(`SCROLL_${m}`, { depth: m });
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

      if (isCta) {
        ctaClickedRef.current = true;
        queueEvent("CTA_CLICK", { text: text.trim().slice(0, 80) });
      } else if (target.tagName === "A") {
        const href = (target as HTMLAnchorElement).href ?? "";
        const isFile = /\.(pdf|docx?|xlsx?|pptx?|zip|csv)(\?|$)/i.test(href);
        if (isFile) {
          fileDownloaded.current = true;
          queueEvent("FILE_DOWNLOAD", { href: href.slice(0, 200) });
        } else {
          queueEvent("LINK_CLICK", { href: href.slice(0, 200), text: text.trim().slice(0, 60) });
        }
      }
    }

    document.addEventListener("click", onDocClick, { passive: true });
    return () => document.removeEventListener("click", onDocClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Heartbeat + flush intervals
  useEffect(() => {
    const heartbeatTimer = setInterval(() => {
      sendHeartbeat();
      flushEvents();
    }, HEARTBEAT_INTERVAL_MS);

    const flushTimer = setInterval(flushEvents, FLUSH_INTERVAL_MS);

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        flushEvents();
        sendHeartbeat();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(heartbeatTimer);
      clearInterval(flushTimer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      // Final flush on unmount
      flushEvents();
      sendHeartbeat();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null; // purely behavioral, no UI
}
