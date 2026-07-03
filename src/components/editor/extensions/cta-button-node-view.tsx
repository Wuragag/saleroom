"use client";

import { useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check } from "lucide-react";

export function CTAButtonNodeView({
  node,
  updateAttributes,
  selected,
}: NodeViewProps) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(node.attrs.label);
  const [url, setUrl] = useState(node.attrs.url);

  const save = () => {
    updateAttributes({ label, url });
    setEditing(false);
  };

  return (
    <NodeViewWrapper
      data-type="cta-button"
      className={selected ? "ring-2 ring-primary rounded-lg" : ""}
    >
      {/* Published CTA is left-aligned; margins come from the global
          div[data-type="cta-button"] rule that also styles the canvas */}
      <div>
        {editing ? (
          <div className="inline-flex flex-col gap-2 p-4 border rounded-lg bg-muted/30 min-w-[300px]">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Button label"
              className="text-center"
            />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
            <Button size="sm" onClick={save}>
              <Check className="h-3 w-3 mr-1" />
              Done
            </Button>
          </div>
        ) : (
          <div className="group relative inline-block">
            <a
              className="inline-block px-8 py-3 rounded-lg font-semibold text-base cursor-default"
              style={{ backgroundColor: "var(--page-accent, #003B22)", color: "#ffffff" }}
              onClick={(e) => e.preventDefault()}
            >
              {node.attrs.label}
            </a>
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="Edit button"
              className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity bg-background border rounded-full shadow-sm"
            >
              <Pencil className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
