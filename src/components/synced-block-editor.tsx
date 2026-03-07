"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { EmbedNode, CTAButtonNode, LogoGridNode, FormNode, ContactCardNode, BannerNode } from "./editor/extensions";
import { SlashCommand } from "./editor/extensions/slash-command";
import { EditorToolbar } from "./editor/editor-toolbar";
import { Check, Loader2 } from "lucide-react";

interface BlockData {
  id: string;
  name: string;
  content: string;
  updatedAt?: string;
}

interface SyncedBlockEditorProps {
  block: BlockData;
  onUpdate: (updated: Partial<BlockData> & { id: string }) => void;
}

export function SyncedBlockEditor({ block, onUpdate }: SyncedBlockEditorProps) {
  const [name, setName] = useState(block.name);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const nameTimerRef = useRef<NodeJS.Timeout | null>(null);

  const initialContent = (() => {
    try {
      return JSON.parse(block.content);
    } catch {
      return { type: "doc", content: [{ type: "paragraph" }] };
    }
  })();

  // Note: SyncedBlockNode is deliberately excluded to prevent nesting
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: "Type '/' for commands..." }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TextStyle,
      Color,
      EmbedNode,
      CTAButtonNode,
      LogoGridNode,
      FormNode,
      ContactCardNode,
      BannerNode,
      SlashCommand,
    ],
    content: initialContent,
  });

  const saveContent = useCallback(
    async (contentJson: string) => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/synced-blocks/${block.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: contentJson }),
        });
        if (res.ok) {
          setSaveStatus("saved");
          onUpdate({ id: block.id, content: contentJson, updatedAt: new Date().toISOString() });
        } else {
          setSaveStatus("unsaved");
        }
      } catch {
        setSaveStatus("unsaved");
      }
    },
    [block.id, onUpdate]
  );

  // Auto-save content on editor changes
  useEffect(() => {
    if (!editor) return;

    const handler = () => {
      setSaveStatus("unsaved");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const json = JSON.stringify(editor.getJSON());
        saveContent(json);
      }, 1000);
    };

    editor.on("update", handler);
    return () => {
      editor.off("update", handler);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [editor, saveContent]);

  // Debounced name save
  function handleNameChange(value: string) {
    setName(value);
    if (nameTimerRef.current) clearTimeout(nameTimerRef.current);
    nameTimerRef.current = setTimeout(async () => {
      const res = await fetch(`/api/synced-blocks/${block.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: value }),
      });
      if (res.ok) {
        onUpdate({ id: block.id, name: value, updatedAt: new Date().toISOString() });
      }
    }, 800);
  }

  return (
    <div>
      {/* Name + save status */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Block name"
          className="flex-1 text-lg font-semibold bg-transparent border-none outline-none placeholder:text-muted-foreground"
        />
        <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          {saveStatus === "saving" && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <Check className="h-3 w-3" />
              Saved
            </>
          )}
          {saveStatus === "unsaved" && "Unsaved"}
        </span>
      </div>

      {/* Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Editor */}
      <div className="mt-3 border border-border rounded-xl bg-card shadow-sm">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
