"use client";

import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";

const SIZES = [
  { value: "sm", label: "S", px: 24 },
  { value: "md", label: "M", px: 48 },
  { value: "lg", label: "L", px: 80 },
  { value: "xl", label: "XL", px: 120 },
] as const;

export function SpacerNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const currentSize = SIZES.find((s) => s.value === node.attrs.height) ?? SIZES[1];

  return (
    <NodeViewWrapper
      data-type="spacer"
      className={selected ? "ring-2 ring-primary/30 rounded-xl" : ""}
    >
      <div
        className="group relative flex items-center justify-center transition-all"
        style={{ height: currentSize.px }}
      >
        {/* Dashed line indicator — only visible on hover */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-dashed border-border opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Size selector — appears on hover */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-card border border-border rounded-full px-1.5 py-0.5 shadow-sm z-10">
          {SIZES.map((s) => (
            <button
              key={s.value}
              onClick={() => updateAttributes({ height: s.value })}
              aria-pressed={node.attrs.height === s.value}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                node.attrs.height === s.value
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </NodeViewWrapper>
  );
}
