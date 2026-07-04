"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Editor } from "@tiptap/core";
import { AUTOSAVE_DEBOUNCE_MS } from "@/lib/constants";

interface UseAutoSaveOptions {
  pageId: string;
  editor: Editor | null;
  activeTabId: string;
  title: string;
  saveTabContent: (tabId: string, content: string) => Promise<void>;
  onPageSaved?: (page: { slug?: string; title?: string }) => void;
}

interface UseAutoSaveReturn {
  saveStatus: "saved" | "saving" | "unsaved";
  forceSave: () => Promise<void>;
  forceSaveTitle: (titleOverride?: string) => Promise<void>;
}

export function useAutoSave({
  pageId,
  editor,
  activeTabId,
  title,
  saveTabContent,
  onPageSaved,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">(
    "saved"
  );
  const contentTimerRef = useRef<NodeJS.Timeout | null>(null);
  const titleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeTabIdRef = useRef(activeTabId);
  const isFirstTitleRender = useRef(true);
  const lastSavedTitleRef = useRef(title);

  // Keep refs in sync so callbacks always access the latest values
  const editorRef = useRef(editor);
  editorRef.current = editor;
  const saveTabContentRef = useRef(saveTabContent);
  saveTabContentRef.current = saveTabContent;
  const onPageSavedRef = useRef(onPageSaved);
  onPageSavedRef.current = onPageSaved;

  // Keep tab ID ref in sync
  activeTabIdRef.current = activeTabId;

  // Keep pageId in a ref so callbacks and unmount handlers access the latest value.
  const pageIdRef = useRef(pageId);
  pageIdRef.current = pageId;

  // Keep title in a ref for immediate saves and the unmount flush.
  const titleRef = useRef(title);
  titleRef.current = title;

  const saveTitle = useCallback(async (value: string) => {
    const res = await fetch(`/api/pages/${pageIdRef.current}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: value }),
    });
    if (!res.ok) throw new Error("Failed to save title");

    lastSavedTitleRef.current = value;
    const data = (await res.json().catch(() => null)) as
      | { slug?: string; title?: string }
      | null;
    if (data) onPageSavedRef.current?.(data);
  }, []);

  const saveContent = useCallback(async () => {
    const ed = editorRef.current;
    if (!ed) return;
    const tabId = activeTabIdRef.current;
    let content: string;
    try {
      content = JSON.stringify(ed.getJSON());
    } catch {
      // Editor may be destroyed — nothing to save
      return;
    }
    setSaveStatus("saving");
    try {
      await saveTabContentRef.current(tabId, content);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("unsaved");
    }
  }, []);

  const forceSave = useCallback(async () => {
    if (contentTimerRef.current) {
      clearTimeout(contentTimerRef.current);
      contentTimerRef.current = null;
    }
    if (titleTimerRef.current) {
      clearTimeout(titleTimerRef.current);
      titleTimerRef.current = null;
    }

    await Promise.all([
      saveContent(),
      titleRef.current !== lastSavedTitleRef.current
        ? saveTitle(titleRef.current)
        : Promise.resolve(),
    ]);
  }, [saveContent, saveTitle]);

  const forceSaveTitle = useCallback(
    async (titleOverride?: string) => {
      if (titleTimerRef.current) {
        clearTimeout(titleTimerRef.current);
        titleTimerRef.current = null;
      }
      await saveTitle(titleOverride ?? titleRef.current);
    },
    [saveTitle]
  );

  // Auto-save on editor content changes
  useEffect(() => {
    if (!editor) return;

    const handler = () => {
      setSaveStatus("unsaved");
      if (contentTimerRef.current) clearTimeout(contentTimerRef.current);
      contentTimerRef.current = setTimeout(() => {
        saveContent();
      }, AUTOSAVE_DEBOUNCE_MS);
    };

    editor.on("update", handler);
    return () => {
      editor.off("update", handler);
      if (contentTimerRef.current) {
        clearTimeout(contentTimerRef.current);
      }
    };
  }, [editor, saveContent]);

  // When switching tabs, flush any pending save for the OLD tab immediately
  // instead of just clearing the timer (which would lose unsaved edits).
  const prevTabIdRef = useRef(activeTabId);
  useEffect(() => {
    if (prevTabIdRef.current === activeTabId) return;
    prevTabIdRef.current = activeTabId;

    // If there was a pending debounce timer, we need to save the old tab's
    // content now before it gets replaced by the new tab's content.
    if (contentTimerRef.current) {
      clearTimeout(contentTimerRef.current);
      contentTimerRef.current = null;

      // Save the old tab's content. At this point the editor may already have
      // the new tab's content loaded, but `updateTabContentLocally` in
      // handleSelectTab ran synchronously before setActiveTabId, so the local
      // tabs state has the correct content. We trigger a server persist for the
      // old tab using the locally stored content via saveTabContent.
      // We cannot rely on editor.getJSON() here because the editor content may
      // have already switched. handleSelectTab snapshots and persists the old
      // tab before changing activeTabId, so this effect only clears the timer.
    }
  }, [activeTabId]);

  // Auto-save title changes (skip the first mount to avoid a wasted PUT)
  useEffect(() => {
    if (isFirstTitleRender.current) {
      isFirstTitleRender.current = false;
      return;
    }

    if (title === lastSavedTitleRef.current) return;

    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(async () => {
      try {
        await saveTitle(title);
      } catch {
        // Silent failure for title save — user can retry via forceSave
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    };
  }, [title, saveTitle]);

  // Save on unmount — uses refs so it always accesses the latest values,
  // avoiding the stale-closure bug from `[]` deps.  Uses `keepalive` so the
  // browser keeps the request alive even after the page starts unloading.
  useEffect(() => {
    return () => {
      const hasPendingContent = !!contentTimerRef.current;
      const hasPendingTitle =
        !!titleTimerRef.current || titleRef.current !== lastSavedTitleRef.current;

      // Clear any pending timers
      if (contentTimerRef.current) {
        clearTimeout(contentTimerRef.current);
        contentTimerRef.current = null;
      }
      if (titleTimerRef.current) {
        clearTimeout(titleTimerRef.current);
        titleTimerRef.current = null;
      }

      // Flush pending tab content save via keepalive fetch
      if (hasPendingContent) {
        const ed = editorRef.current;
        const tabId = activeTabIdRef.current;
        if (ed && tabId) {
          try {
            const content = JSON.stringify(ed.getJSON());
            fetch(`/api/tabs/${tabId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content }),
              keepalive: true,
            }).catch(() => {});
          } catch {
            // Editor may already be destroyed — nothing to save
          }
        }
      }

      // Flush pending title save via keepalive fetch
      if (hasPendingTitle) {
        fetch(`/api/pages/${pageIdRef.current}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: titleRef.current }),
          keepalive: true,
        }).catch(() => {});
      }
    };
  }, []);
  return { saveStatus, forceSave, forceSaveTitle };
}
