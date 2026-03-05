"use client";

import { useEffect, useRef } from "react";

interface AnalyticsTrackerProps {
  pageId: string;
  viewId: string;
}

export function AnalyticsTracker({ pageId, viewId }: AnalyticsTrackerProps) {
  // Track only visible time — pause when tab is hidden
  const visibleDuration = useRef(0); // accumulated seconds while visible
  const lastVisibleAt = useRef(Date.now()); // timestamp when tab last became visible
  const sending = useRef(false);

  useEffect(() => {
    const accumulateDuration = () => {
      if (document.visibilityState !== "hidden") {
        // Tab is visible, accumulate time since last visible timestamp
        visibleDuration.current += (Date.now() - lastVisibleAt.current) / 1000;
        lastVisibleAt.current = Date.now();
      }
    };

    const sendDuration = () => {
      accumulateDuration();
      if (sending.current) return;
      sending.current = true;
      const duration = Math.round(visibleDuration.current);
      fetch(`/api/analytics/view/${viewId}`, {
        method: "PATCH",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration }),
      })
        .catch(() => {})
        .finally(() => { sending.current = false; });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Tab hidden — accumulate and send
        sendDuration();
      } else {
        // Tab visible again — reset the "last visible" timestamp
        lastVisibleAt.current = Date.now();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", sendDuration);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", sendDuration);
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
      fetch("/api/analytics/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, type: "link_click", meta: href }),
      });
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pageId]);

  return null;
}
