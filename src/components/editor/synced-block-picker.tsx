"use client";

import { useState, useEffect, useCallback } from "react";
import { Link2, Search, Plus, Loader2 } from "lucide-react";
import type { Editor } from "@tiptap/core";
import type { SyncedBlockListItem } from "@/types";

interface SyncedBlockPickerProps {
  editor: Editor | null;
}

export function SyncedBlockPicker({ editor }: SyncedBlockPickerProps) {
  const [open, setOpen] = useState(false);
  const [blocks, setBlocks] = useState<SyncedBlockListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [editorRef, setEditorRef] = useState<Editor | null>(null);

  const handleEvent = useCallback((e: Event) => {
    const detail = (e as CustomEvent).detail;
    setEditorRef(detail?.editor || null);
    setOpen(true);
  }, []);

  useEffect(() => {
    window.addEventListener("sr:insert-synced-block", handleEvent);
    return () => window.removeEventListener("sr:insert-synced-block", handleEvent);
  }, [handleEvent]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSearch("");
    fetch("/api/synced-blocks")
      .then((res) => res.json())
      .then((data) => {
        setBlocks(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [open]);

  const handleSelect = (block: SyncedBlockListItem) => {
    const target = editorRef || editor;
    if (target) {
      target
        .chain()
        .focus()
        .insertContent({
          type: "syncedBlock",
          attrs: { syncedBlockId: block.id, blockName: block.name },
        })
        .run();
    }
    setOpen(false);
  };

  const filtered = blocks.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => setOpen(false)}
      />
      {/* Dialog */}
      <div className="relative bg-popover border rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Search header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search synced blocks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          <button
            onClick={() => setOpen(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Esc
          </button>
        </div>

        {/* Content */}
        <div className="max-h-72 overflow-y-auto p-1">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                {blocks.length === 0
                  ? "No synced blocks yet"
                  : "No matching blocks"}
              </p>
              {blocks.length === 0 && (
                <a
                  href="/library"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create your first block
                </a>
              )}
            </div>
          ) : (
            filtered.map((block) => (
              <button
                key={block.id}
                onClick={() => handleSelect(block)}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-left transition-colors hover:bg-accent/50"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center">
                  <Link2 className="h-4 w-4 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{block.name}</div>
                  <div className="text-xs text-muted-foreground">
                    by {block.createdBy.name} · updated{" "}
                    {new Date(block.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        {blocks.length > 0 && (
          <div className="border-t px-4 py-2.5">
            <a
              href="/library"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="h-3 w-3" />
              Manage blocks in Library
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
