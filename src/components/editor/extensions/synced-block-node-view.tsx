"use client";

import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useEffect, useState, useMemo } from "react";
import { Link2, AlertTriangle, Loader2 } from "lucide-react";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import DOMPurify from "dompurify";

// Lightweight extensions for rendering preview (no custom nodes to prevent recursion)
const previewExtensions = [
  StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
  Image.configure({ inline: false, allowBase64: false }),
  Table.configure({ resizable: false }),
  TableRow,
  TableCell,
  TableHeader,
  TextStyle,
  Color,
];

export function SyncedBlockNodeView({ node, selected }: NodeViewProps) {
  const { syncedBlockId, blockName } = node.attrs;
  const [content, setContent] = useState<string | null>(null);
  const [name, setName] = useState<string>(blockName || "");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!syncedBlockId) {
      setLoading(false);
      return;
    }

    fetch(`/api/synced-blocks/${syncedBlockId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setContent(data.content);
        setName(data.name || blockName || "");
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [syncedBlockId, blockName]);

  const previewHtml = useMemo(() => {
    if (!content) return "";
    try {
      const parsed = JSON.parse(content);
      const raw = generateHTML(parsed, previewExtensions);
      return DOMPurify.sanitize(raw, {
        ADD_TAGS: ["iframe"],
        ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "target"],
      });
    } catch {
      return "<p>Unable to render preview</p>";
    }
  }, [content]);

  if (!syncedBlockId) {
    return (
      <NodeViewWrapper data-type="synced-block">
        <div className="flex items-center justify-center gap-2 p-8 border-2 border-dashed rounded-lg text-muted-foreground">
          <Link2 className="h-5 w-5" />
          <span>No synced block linked</span>
        </div>
      </NodeViewWrapper>
    );
  }

  if (loading) {
    return (
      <NodeViewWrapper data-type="synced-block">
        <div className="border border-dashed border-primary/40 rounded-lg p-4 my-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading synced block...</span>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  if (error) {
    return (
      <NodeViewWrapper data-type="synced-block">
        <div className="border border-dashed border-destructive/40 rounded-lg p-4 my-2 bg-destructive/5">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>This synced block was deleted or is unavailable</span>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      data-type="synced-block"
      className={selected ? "ring-2 ring-primary rounded-lg" : ""}
    >
      <div className="relative border border-dashed border-primary/40 rounded-lg my-2 overflow-hidden">
        {/* Header badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 border-b border-primary/20 text-xs font-medium text-primary">
          <Link2 className="h-3 w-3" />
          <span className="truncate">{name || "Synced Block"}</span>
          <span className="text-primary/60 ml-auto">synced</span>
        </div>
        {/* Content preview */}
        <div
          className="px-4 py-3 pub-content pointer-events-none text-sm"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </div>
    </NodeViewWrapper>
  );
}
