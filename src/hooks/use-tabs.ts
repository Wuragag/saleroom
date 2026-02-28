"use client";

import { useState, useCallback } from "react";
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
}

export function useTabs(pageId: string, initialTabs: TabData[]): UseTabsReturn {
  const [tabs, setTabs] = useState<TabData[]>(initialTabs);
  const [activeTabId, setActiveTabId] = useState(
    initialTabs[0]?.id || ""
  );

  const activeTab = tabs.find((t) => t.id === activeTabId) || null;

  const addTab = useCallback(async () => {
    const res = await fetch(`/api/pages/${pageId}/tabs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `Tab ${tabs.length + 1}` }),
    });
    const tab: TabData = await res.json();
    setTabs((prev) => [...prev, tab]);
    setActiveTabId(tab.id);
  }, [pageId, tabs.length]);

  const renameTab = useCallback(async (tabId: string, name: string) => {
    await fetch(`/api/tabs/${tabId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, name } : t))
    );
  }, []);

  const deleteTab = useCallback(
    async (tabId: string) => {
      if (tabs.length <= 1) return;

      await fetch(`/api/tabs/${tabId}`, { method: "DELETE" });

      setTabs((prev) => {
        const updated = prev.filter((t) => t.id !== tabId);
        // If we deleted the active tab, switch to the first remaining
        if (tabId === activeTabId && updated.length > 0) {
          setActiveTabId(updated[0].id);
        }
        return updated;
      });
    },
    [tabs.length, activeTabId]
  );

  const reorderTabs = useCallback(
    async (tabIds: string[]) => {
      // Optimistic update
      setTabs((prev) => {
        const tabMap = new Map(prev.map((t) => [t.id, t]));
        return tabIds
          .map((id, i) => {
            const tab = tabMap.get(id);
            return tab ? { ...tab, order: i } : null;
          })
          .filter(Boolean) as TabData[];
      });

      await fetch(`/api/pages/${pageId}/tabs/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tabIds }),
      });
    },
    [pageId]
  );

  const saveTabContent = useCallback(
    async (tabId: string, content: string) => {
      await fetch(`/api/tabs/${tabId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      setTabs((prev) =>
        prev.map((t) => (t.id === tabId ? { ...t, content } : t))
      );
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
  };
}
