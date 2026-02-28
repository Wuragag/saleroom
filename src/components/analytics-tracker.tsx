"use client";

import { useEffect, useRef } from "react";

interface AnalyticsTrackerProps {
  pageId: string;
  viewId: string;
}

export function AnalyticsTracker({ pageId, viewId }: AnalyticsTrackerProps) {
  const mountTime = useRef(Date.now());
  const sent = useRef(false);

  useEffect(() => {
    const sendDuration = () => {
      if (sent.current) return;
      sent.current = true;
      const duration = Math.round((Date.now() - mountTime.current) / 1000);
      navigator.sendBeacon(
        `/api/analytics/view/${viewId}`,
        JSON.stringify({ duration })
      );
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
