"use client";

import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Trash2 } from "lucide-react";

type Variant = "none" | "wash" | "tint" | "ink";

export function SectionNodeView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const variant: Variant = node.attrs.variant ?? "wash";

  return (
    <NodeViewWrapper
      data-type="section"
      data-variant={variant}
      className={`pub-section pub-section--${variant} group relative ${selected ? "ring-2 ring-primary" : ""}`}
    >
      {/* Hover chrome — not part of the content, not editable */}
      <div
        contentEditable={false}
        className="absolute top-2 right-2 z-10 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity"
      >
        <div className="w-44 rounded-lg bg-background/95 backdrop-blur shadow-sm border border-border p-0.5">
          <SegmentedControl
            aria-label="Section background"
            value={variant}
            onChange={(v) => updateAttributes({ variant: v })}
            options={[
              { value: "none", label: "None" },
              { value: "wash", label: "Wash" },
              { value: "tint", label: "Tint" },
              { value: "ink", label: "Ink" },
            ]}
          />
        </div>
        <button
          type="button"
          onClick={() => deleteNode()}
          aria-label="Delete section"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-background/95 backdrop-blur border border-border text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <NodeViewContent className="pub-section-inner" />
    </NodeViewWrapper>
  );
}
