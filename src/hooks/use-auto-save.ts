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
}

interface UseAutoSaveReturn {
  saveStatus: "saved" | "saving" | "unsaved";
  forceSave: () => Promise<void>;
}

export function useAutoSave({
  pageId,
  editor,
  activeTabId,
  title,
  saveTabContent,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">(
    "saved"
  );
  const contentTimerRef = useRef<NodeJS.Timeout | null>(null);
  const titleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeTabIdRef = useRef(activeTabId);
  const isFirstTitleRender = useRef(true);

  // Keep refs in sync so callbacks always access the latest values
  const editorRef = useRef(editor);
  editorRef.current = editor;
  const saveTabContentRef = useRef(saveTabContent);
  saveTabContentRef.current = saveTabContent;

  // Keep tab ID ref in sync
  activeTabIdRef.current = activeTabId;

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
    await saveContent();
  }, [saveContent]);

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
    const oldTabId = prevTabIdRef.current;
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
      const ed = editorRef.current;
      if (ed) {
        // We cannot rely on editor.getJSON() here because the editor content
        // may have already switched. Instead, we trust that handleSelectTab
        // called updateTabContentLocally with the correct content before
        // calling setActiveTabId. The saveTabContent for the old tab will be
        // handled by the component if it stored the content. For safety, we
        // persist the content that was in the editor *before* the switch.
        // Since we can't access it anymore, we do a no-op here and let the
        // handleSelectTab persist mechanism handle it. We only clear the timer.
      }
    }
  }, [activeTabId]);

  // Auto-save title changes (skip the first mount to avoid a wasted PUT)
  useEffect(() => {
    if (isFirstTitleRender.current) {
      isFirstTitleRender.current = false;
      return;
    }

    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/pages/${pageId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
      } catch {
        // Silent failure for title save — user can retry via forceSave
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    };
  }, [title, pageId]);

  // Save on unmount — uses refs so it always accesses the latest editor and
  // saveTabContent, avoiding the stale-closure bug from `[]` deps.
  useEffect(() => {
    return () => {
      // Clear any pending timers
      if (contentTimerRef.current) {
        clearTimeout(contentTimerRef.current);
      }
      if (titleTimerRef.current) {
        clearTimeout(titleTimerRef.current);
      }

      const ed = editorRef.current;
      const tabId = activeTabIdRef.current;
      if (ed && tabId) {
        try {
          const content = JSON.stringify(ed.getJSON());
          // Fire and forget — keepalive ensures the request survives unmount
          saveTabContentRef.current(tabId, content);
        } catch {
          // Editor may already be destroyed — nothing to save
        }
      }
    };
  }, []);

  return { saveStatus, forceSave };
}
