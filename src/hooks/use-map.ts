"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import type { MutualActionPlanData, MapItemData } from "@/types";

export type UseMapReturn = ReturnType<typeof useMap>;

export function useMap(pageId: string) {
  const [map, setMap] = useState<MutualActionPlanData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMap = useCallback(async () => {
    try {
      const data = await apiClient.get<{ map: MutualActionPlanData | null }>(
        `/api/pages/${pageId}/map`
      );
      setMap(data.map ?? null);
    } catch {
      // Silent — map may not exist yet
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    fetchMap();
  }, [fetchMap]);

  const enableMap = async () => {
    try {
      const data = await apiClient.post<{ map: MutualActionPlanData }>(
        `/api/pages/${pageId}/map`,
        {}
      );
      setMap(data.map);
    } catch {
      toast.error("Failed to enable action plan");
    }
  };

  const disableMap = async () => {
    try {
      await apiClient.delete(`/api/pages/${pageId}/map`);
      setMap(null);
    } catch {
      toast.error("Failed to remove action plan");
    }
  };

  const updateMap = async (patch: { title?: string; closeDate?: string | null }) => {
    try {
      const data = await apiClient.post<{ map: MutualActionPlanData }>(
        `/api/pages/${pageId}/map`,
        patch
      );
      setMap(data.map);
    } catch {
      toast.error("Failed to update action plan");
    }
  };

  const addItem = async (item: {
    title: string;
    ownerType: "seller" | "buyer";
    ownerName: string;
    dueDate?: string | null;
  }) => {
    try {
      const data = await apiClient.post<{ item: MapItemData }>(
        `/api/pages/${pageId}/map/items`,
        item
      );
      setMap((prev) =>
        prev ? { ...prev, items: [...prev.items, data.item] } : prev
      );
      return data.item;
    } catch {
      toast.error("Failed to add item");
    }
  };

  const updateItem = async (itemId: string, patch: Partial<MapItemData>) => {
    // Snapshot for rollback
    const prevMap = map;
    setMap((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId ? { ...item, ...patch } : item
        ),
      };
    });

    try {
      await apiClient.put(`/api/pages/${pageId}/map/items/${itemId}`, patch);
    } catch {
      toast.error("Failed to update item");
      setMap(prevMap);
    }
  };

  const deleteItem = async (itemId: string) => {
    // Snapshot for rollback
    const prevMap = map;
    setMap((prev) => {
      if (!prev) return prev;
      return { ...prev, items: prev.items.filter((item) => item.id !== itemId) };
    });

    try {
      await apiClient.delete(`/api/pages/${pageId}/map/items/${itemId}`);
    } catch {
      toast.error("Failed to delete item");
      setMap(prevMap);
    }
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

    try {
      await apiClient.put(`/api/pages/${pageId}/map/items/reorder`, { itemIds });
    } catch {
      toast.error("Failed to reorder items");
      fetchMap();
    }
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
