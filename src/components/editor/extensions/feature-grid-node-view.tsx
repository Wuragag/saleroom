"use client";

import { useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Pencil, Check, Plus, Trash2 } from "lucide-react";

interface Feature {
  icon: string;
  title: string;
  description: string;
}

export function FeatureGridNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState<Feature[]>(node.attrs.items ?? []);
  const [cols, setCols] = useState<number>(node.attrs.cols ?? 3);

  const save = () => {
    updateAttributes({ items, cols });
    setEditing(false);
  };
  const update = (i: number, field: keyof Feature, value: string) => {
    const next = [...items];
    next[i] = { ...next[i], [field]: value };
    setItems(next);
  };
  const add = () => items.length < 6 && setItems([...items, { icon: "✨", title: "Title", description: "Description" }]);
  const remove = (i: number) => items.length > 1 && setItems(items.filter((_, j) => j !== i));

  return (
    <NodeViewWrapper data-type="feature-grid" className={selected ? "ring-2 ring-primary rounded-xl" : ""}>
      {editing ? (
        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2 items-start">
              <Input value={item.icon} onChange={(e) => update(i, "icon", e.target.value)} placeholder="🚀" className="w-14 text-center" />
              <div className="flex-1 space-y-1.5">
                <Input value={item.title} onChange={(e) => update(i, "title", e.target.value)} placeholder="Title" />
                <Input value={item.description} onChange={(e) => update(i, "description", e.target.value)} placeholder="Description" />
              </div>
              {items.length > 1 && (
                <button onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          <div className="flex items-center justify-between gap-3">
            {items.length < 6 && (
              <button onClick={add} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Plus className="h-3 w-3" /> Add feature
              </button>
            )}
            <div className="w-32 ml-auto">
              <SegmentedControl
                aria-label="Columns"
                value={String(cols)}
                onChange={(v) => setCols(Number(v))}
                options={[{ value: "2", label: "2 cols" }, { value: "3", label: "3 cols" }]}
              />
            </div>
          </div>
          <Button size="sm" onClick={save} className="w-full">
            <Check className="h-3.5 w-3.5 mr-1.5" /> Done
          </Button>
        </div>
      ) : (
        <div className="group relative">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gap: "14px",
              padding: "14px",
              margin: "1.5rem 0",
              borderRadius: "var(--pub-radius-lg, 16px)",
              background: "var(--node-wash, transparent)",
            }}
          >
            {items.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: "22px 18px",
                  borderRadius: "var(--pub-radius-md, 12px)",
                  background: "var(--metric-cell-bg, #ffffff)",
                  boxShadow: "var(--pub-shadow-sm, 0 0 0 0 rgba(0,0,0,0))",
                }}
              >
                <div style={{ fontSize: "24px", marginBottom: "10px", lineHeight: 1 }}>{item.icon}</div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--node-text, #17171a)", marginBottom: "5px" }}>{item.title}</div>
                <div style={{ fontSize: "13.5px", lineHeight: 1.55, color: "var(--node-muted, #64748b)" }}>{item.description}</div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit features"
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity bg-muted/80 hover:bg-muted rounded-full"
          >
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      )}
    </NodeViewWrapper>
  );
}
