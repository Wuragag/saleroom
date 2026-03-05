"use client";

import { useState, useEffect, useCallback } from "react";
import type { MutualActionPlanData, MapItemData } from "@/types";

export function useMap(pageId: string) {
  const [map, setMap] = useState<MutualActionPlanData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMap = useCallback(async () => {
    try {
      const res = await fetch(`/api/pages/${pageId}/map`);
      if (!res.ok) return;
      const data = await res.json();
      setMap(data.map ?? null);
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    fetchMap();
  }, [fetchMap]);

  const enableMap = async () => {
    const res = await fetch(`/api/pages/${pageId}/map`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      const data = await res.json();
      setMap(data.map);
    }
  };

  const disableMap = async () => {
    const res = await fetch(`/api/pages/${pageId}/map`, { method: "DELETE" });
    if (res.ok) setMap(null);
  };

  const updateMap = async (patch: { title?: string; closeDate?: string | null }) => {
    const res = await fetch(`/api/pages/${pageId}/map`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const data = await res.json();
      setMap(data.map);
    }
  };

  const addItem = async (item: {
    title: string;
    ownerType: "seller" | "buyer";
    ownerName: string;
    dueDate?: string | null;
  }) => {
    const res = await fetch(`/api/pages/${pageId}/map/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (res.ok) {
      const data = await res.json();
      setMap((prev) =>
        prev ? { ...prev, items: [...prev.items, data.item] } : prev
      );
      return data.item;
    }
  };

  const updateItem = async (itemId: string, patch: Partial<MapItemData>) => {
    // Optimistic update
    setMap((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId ? { ...item, ...patch } : item
        ),
      };
    });

    const res = await fetch(`/api/pages/${pageId}/map/items/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      // Revert on failure
      fetchMap();
    }
  };

  const deleteItem = async (itemId: string) => {
    // Optimistic update
    setMap((prev) => {
      if (!prev) return prev;
      return { ...prev, items: prev.items.filter((item) => item.id !== itemId) };
    });

    const res = await fetch(`/api/pages/${pageId}/map/items/${itemId}`, {
      method: "DELETE",
    });
    if (!res.ok) fetchMap();
  };

  const reorderItems = async (itemIds: string[]) => {
    // Optimistic update
    setMap((prev) => {
      if (!prev) return prev;
      const ordered = itemIds
        .map((id, i) => {
          const item = prev.items.find((it) => it.id === id);
          return item ? { ...item, order: i } : null;
        })
        .filter(Boolean) as MapItemData[];
      return { ...prev, items: ordered };
    });

    await fetch(`/api/pages/${pageId}/map/items/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemIds }),
    });
  };

  return {
    map,
    loading,
    enableMap,
    disableMap,
    updateMap,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
  };
}
