"use client";

import { useEffect, useRef, useState } from "react";
import { createVisibleTimeTracker, type VisibleTimeTracker } from "@/lib/visible-time";

interface AnalyticsTrackerProps {
  pageId: string;
}

export function AnalyticsTracker({ pageId }: AnalyticsTrackerProps) {
  const [viewId, setViewId] = useState<string | null>(null);

  // Create the pageView client-side on mount (moved from server component to enable ISR caching)
  useEffect(() => {
    fetch("/api/analytics/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.viewId) setViewId(data.viewId);
      })
      .catch(() => {});
  }, [pageId]);

  // Track only visible time — pause when tab is hidden
  const visibleTime = useRef<VisibleTimeTracker | null>(null);

  useEffect(() => {
    if (!viewId) return;

    if (!visibleTime.current) {
      visibleTime.current = createVisibleTimeTracker({
        initiallyVisible: document.visibilityState !== "hidden",
      });
    }
    const tracker = visibleTime.current;

    // Always send the absolute running total — the server takes the max, so
    // duplicate or out-of-order sends are harmless.
    const sendDuration = () => {
      fetch(`/api/analytics/view/${viewId}`, {
        method: "PATCH",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration: tracker.getSeconds() }),
      }).catch(() => {});
    };

    const handleVisibilityChange = () => {
      const visible = document.visibilityState !== "hidden";
      tracker.setVisible(visible);
      if (!visible) sendDuration();
    };

    // pagehide instead of beforeunload — beforeunload never fires on mobile
    // Safari; keepalive fetch survives the page teardown.
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", sendDuration);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", sendDuration);
    };
  }, [viewId]);

  // Fix #5: Track only truly external link clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as Element).closest("a[href]");
      if (!target) return;
      const href = (target as HTMLAnchorElement).href;
      if (!href) return;
      // Skip all internal links (same origin)
      if (href.startsWith(window.location.origin)) return;
      // Strip query/fragment — they can carry tokens, emails, and other PII
      let meta = href;
      try {
        const u = new URL(href);
        u.search = "";
        u.hash = "";
        meta = u.toString();
      } catch {}
      fetch("/api/analytics/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, type: "link_click", meta }),
      });
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pageId]);

  return null;
}
