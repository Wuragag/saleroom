"use client";

import { useEffect, useRef } from "react";

interface AnalyticsTrackerProps {
  pageId: string;
  viewId: string;
}

export function AnalyticsTracker({ pageId, viewId }: AnalyticsTrackerProps) {
  const mountTime = useRef(Date.now());
  const sending = useRef(false);

  useEffect(() => {
    const sendDuration = () => {
      // Debounce concurrent sends but allow re-sending on future events
      // so the duration stays accurate when the user tabs away and back.
      if (sending.current) return;
      sending.current = true;
      const duration = Math.round((Date.now() - mountTime.current) / 1000);
      // Use fetch with keepalive instead of sendBeacon so we can send PATCH
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
      if (document.visibilityState === "hidden") sendDuration();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", sendDuration);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", sendDuration);
    };
  }, [viewId]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as Element).closest("a[href]");
      if (!target) return;
      const href = (target as HTMLAnchorElement).href;
      // Only track external links
      if (!href || href.startsWith(window.location.origin + "/p/")) return;
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
