"use client";

import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useEffect, useState, useMemo } from "react";
import { Link2, AlertTriangle, Loader2 } from "lucide-react";
import { generateHTML } from "@tiptap/html";
import DOMPurify from "dompurify";
import { buildPubExtensions, PUB_SANITIZE_CONFIG } from "@/lib/pub-nodes";

// Same extension set as the published renderer, so custom blocks (CTA,
// testimonial, metrics, banner, …) preview correctly instead of throwing.
// Nested synced references render as the server fallback's dashed placeholder,
// which also prevents infinite recursion. Colors ride on the --pub-* CSS vars
// already set on the editor canvas, so the literal fallbacks rarely show.
const previewExtensions = buildPubExtensions();

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
      return DOMPurify.sanitize(raw, PUB_SANITIZE_CONFIG);
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
      className={selected ? "ring-2 ring-primary rounded-xl" : ""}
    >
      <div className="relative border border-dashed border-primary/40 rounded-xl my-2 overflow-hidden">
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
