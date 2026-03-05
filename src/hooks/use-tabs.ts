"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { TabData } from "@/types";

interface UseTabsReturn {
  tabs: TabData[];
  activeTab: TabData | null;
  activeTabId: string;
  setActiveTabId: (id: string) => void;
  addTab: () => Promise<void>;
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

  const addTab = useCallback(async () => {
    setTabLimitError(null);
    try {
      const res = await fetch(`/api/pages/${pageId}/tabs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `Tab ${tabs.length + 1}` }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "PLAN_LIMIT") {
          setTabLimitError(data.error);
        } else {
          toast.error(data.error ?? "Failed to add tab");
        }
        return;
      }
      const tab: TabData = data;
      setTabs((prev) => [...prev, tab]);
      setActiveTabId(tab.id);
    } catch {
      toast.error("Failed to add tab");
    }
  }, [pageId, tabs.length]);

  const renameTab = useCallback(async (tabId: string, name: string) => {
    // Optimistic update
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, name } : t))
    );
    try {
      const res = await fetch(`/api/tabs/${tabId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        toast.error("Failed to rename tab");
      }
    } catch {
      toast.error("Failed to rename tab");
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
        const res = await fetch(`/api/tabs/${tabId}`, { method: "DELETE" });
        if (!res.ok) {
          toast.error("Failed to delete tab");
          setTabs(prevTabs);
        }
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
        const res = await fetch(`/api/pages/${pageId}/tabs/reorder`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tabIds }),
        });
        if (!res.ok) {
          toast.error("Failed to reorder tabs");
          setTabs(prevTabs);
        }
      } catch {
        toast.error("Failed to reorder tabs");
        setTabs(prevTabs);
      }
    },
    [pageId, tabs]
  );

  const saveTabContent = useCallback(
    async (tabId: string, content: string) => {
      try {
        const res = await fetch(`/api/tabs/${tabId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        if (res.ok) {
          setTabs((prev) =>
            prev.map((t) => (t.id === tabId ? { ...t, content } : t))
          );
        }
      } catch {
        // Content save failures are handled by the auto-save status indicator
      }
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
