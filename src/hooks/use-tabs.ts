"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/api-client";
import type { TabData } from "@/types";

interface UseTabsReturn {
  tabs: TabData[];
  activeTab: TabData | null;
  activeTabId: string;
  setActiveTabId: (id: string) => void;
  addTab: (name?: string) => Promise<TabData | null>;
  renameTab: (tabId: string, name: string) => Promise<void>;
  deleteTab: (tabId: string) => Promise<void>;
  reorderTabs: (tabIds: string[]) => Promise<void>;
  saveTabContent: (tabId: string, content: string) => Promise<void>;
  updateTabContentLocally: (tabId: string, content: string) => void;
  tabLimitError: string | null;
  clearTabLimitError: () => void;
}

export function useTabs(pageId: string, initialTabs: TabData[]): UseTabsReturn {
  const [tabs, setTabs] = useState<TabData[]>(initialTabs);
  const [activeTabId, setActiveTabId] = useState(
    initialTabs[0]?.id || ""
  );
  const [tabLimitError, setTabLimitError] = useState<string | null>(null);

  const clearTabLimitError = useCallback(() => setTabLimitError(null), []);

  const activeTab = tabs.find((t) => t.id === activeTabId) || null;

  const addTab = useCallback(
    async (name?: string): Promise<TabData | null> => {
      setTabLimitError(null);
      try {
        const tab = await apiClient.post<TabData>(`/api/pages/${pageId}/tabs`, {
          name: name?.trim() || `Tab ${tabs.length + 1}`,
        });
        setTabs((prev) => [...prev, tab]);
        setActiveTabId(tab.id);
        return tab;
      } catch (err) {
        if (err instanceof ApiError && err.code === "PLAN_LIMIT") {
          setTabLimitError(err.message);
        } else {
          toast.error(err instanceof ApiError ? err.message : "Failed to add tab");
        }
        return null;
      }
    },
    [pageId, tabs.length]
  );

  const renameTab = useCallback(async (tabId: string, name: string) => {
    // Optimistic update — capture previous name for rollback
    let prevName: string | undefined;
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id === tabId) {
          prevName = t.name;
          return { ...t, name };
        }
        return t;
      })
    );
    try {
      await apiClient.put(`/api/tabs/${tabId}`, { name });
    } catch {
      toast.error("Failed to rename tab");
      // Rollback to previous name
      if (prevName !== undefined) {
        setTabs((prev) =>
          prev.map((t) => (t.id === tabId ? { ...t, name: prevName! } : t))
        );
      }
    }
  }, []);

  const deleteTab = useCallback(
    async (tabId: string) => {
      if (tabs.length <= 1) return;

      // Optimistic update
      const prevTabs = tabs;
      setTabs((prev) => {
        const updated = prev.filter((t) => t.id !== tabId);
        if (tabId === activeTabId && updated.length > 0) {
          setActiveTabId(updated[0].id);
        }
        return updated;
      });

      try {
        await apiClient.delete(`/api/tabs/${tabId}`);
      } catch {
        toast.error("Failed to delete tab");
        setTabs(prevTabs);
      }
    },
    [tabs, activeTabId]
  );

  const reorderTabs = useCallback(
    async (tabIds: string[]) => {
      // Optimistic update
      const prevTabs = tabs;
      setTabs((prev) => {
        const tabMap = new Map(prev.map((t) => [t.id, t]));
        return tabIds
          .map((id, i) => {
            const tab = tabMap.get(id);
            return tab ? { ...tab, order: i } : null;
          })
          .filter(Boolean) as TabData[];
      });

      try {
        await apiClient.put(`/api/pages/${pageId}/tabs/reorder`, { tabIds });
      } catch {
        toast.error("Failed to reorder tabs");
        setTabs(prevTabs);
      }
    },
    [pageId, tabs]
  );

  const saveTabContent = useCallback(
    async (tabId: string, content: string) => {
      // Always update local state so tab switching shows the latest content,
      // even if the server request fails.
      setTabs((prev) =>
        prev.map((t) => (t.id === tabId ? { ...t, content } : t))
      );
      // Let errors propagate so the auto-save hook can show the correct status.
      await apiClient.put(`/api/tabs/${tabId}`, { content });
    },
    []
  );

  // Update content in local state only (no API call) — used when switching
  // tabs to snapshot current editor content before the switch happens.
  const updateTabContentLocally = useCallback(
    (tabId: string, content: string) => {
      setTabs((prev) =>
        prev.map((t) => (t.id === tabId ? { ...t, content } : t))
      );
    },
    []
  );

  return {
    tabs,
    activeTab,
    activeTabId,
    setActiveTabId,
    addTab,
    renameTab,
    deleteTab,
    reorderTabs,
    saveTabContent,
    updateTabContentLocally,
    tabLimitError,
    clearTabLimitError,
  };
}
