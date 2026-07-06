"use client";

import { useState, useEffect, useCallback } from "react";
import type { ActivityFeedItem } from "@/types";

interface UseActivityFeedReturn {
  items: ActivityFeedItem[];
  loading: boolean;
  error: boolean;
  refresh: () => void;
}

/**
 * Loads the workspace Recent Activity feed once on mount. Lightweight: no
 * pagination (the drawer shows the latest slice; "View all" goes to analytics).
 */
export function useActivityFeed(limit = 15): UseActivityFeedReturn {
  const [items, setItems] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/activity?limit=${limit}`);
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, refresh: load };
}
