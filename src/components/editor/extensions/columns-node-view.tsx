"use client";

import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Trash2 } from "lucide-react";

type Ratio = "50-50" | "60-40" | "40-60";

const TEMPLATES: Record<Ratio, string> = {
  "50-50": "1fr 1fr",
  "60-40": "3fr 2fr",
  "40-60": "2fr 3fr",
};

export function ColumnsNodeView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const ratio: Ratio = node.attrs.ratio ?? "50-50";

  return (
    <NodeViewWrapper
      data-type="columns"
      className={`group relative my-6 ${selected ? "ring-2 ring-primary rounded-lg" : ""}`}
    >
      <div
        contentEditable={false}
        className="absolute -top-3 right-2 z-10 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity"
      >
        <div className="w-40 rounded-lg bg-background/95 backdrop-blur shadow-sm border border-border p-0.5">
          <SegmentedControl
            aria-label="Column ratio"
            value={ratio}
            onChange={(v) => updateAttributes({ ratio: v })}
            options={[
              { value: "50-50", label: "50/50" },
              { value: "60-40", label: "60/40" },
              { value: "40-60", label: "40/60" },
            ]}
          />
        </div>
        <button
          type="button"
          onClick={() => deleteNode()}
          aria-label="Delete columns"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-background/95 backdrop-blur border border-border text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <NodeViewContent
        className="pub-columns-grid"
        style={{ display: "grid", gridTemplateColumns: TEMPLATES[ratio], gap: "28px" }}
      />
    </NodeViewWrapper>
  );
}
