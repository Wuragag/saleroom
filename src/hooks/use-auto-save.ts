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

  // Keep ref in sync
  activeTabIdRef.current = activeTabId;

  const saveContent = useCallback(async () => {
    if (!editor) return;
    const tabId = activeTabIdRef.current;
    const content = JSON.stringify(editor.getJSON());
    setSaveStatus("saving");
    try {
      await saveTabContent(tabId, content);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("unsaved");
    }
  }, [editor, saveTabContent]);

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

  // Clear debounce timer when switching tabs so the pending save from the
  // previous tab doesn't fire on the new tab's ID.
  useEffect(() => {
    if (contentTimerRef.current) {
      clearTimeout(contentTimerRef.current);
      contentTimerRef.current = null;
    }
  }, [activeTabId]);

  // Auto-save title changes
  useEffect(() => {
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(async () => {
      await fetch(`/api/pages/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    };
  }, [title, pageId]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (editor && activeTabIdRef.current) {
        const content = JSON.stringify(editor.getJSON());
        // Fire and forget
        saveTabContent(activeTabIdRef.current, content);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { saveStatus, forceSave };
}
