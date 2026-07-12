"use client";

import { useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check, Plus, Trash2 } from "lucide-react";

interface Step {
  label: string;
  title: string;
  description: string;
}

export function TimelineNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState<Step[]>(node.attrs.items ?? []);

  const save = () => {
    updateAttributes({ items });
    setEditing(false);
  };
  const update = (i: number, field: keyof Step, value: string) => {
    const next = [...items];
    next[i] = { ...next[i], [field]: value };
    setItems(next);
  };
  const add = () => items.length < 10 && setItems([...items, { label: "Step", title: "Title", description: "Description" }]);
  const remove = (i: number) => items.length > 1 && setItems(items.filter((_, j) => j !== i));

  return (
    <NodeViewWrapper data-type="timeline" className={selected ? "ring-2 ring-primary rounded-xl" : ""}>
      {editing ? (
        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2 items-start">
              <Input value={item.label} onChange={(e) => update(i, "label", e.target.value)} placeholder="Date" className="w-24" />
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
          {items.length < 10 && (
            <button onClick={add} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Plus className="h-3 w-3" /> Add step
            </button>
          )}
          <Button size="sm" onClick={save} className="w-full">
            <Check className="h-3.5 w-3.5 mr-1.5" /> Done
          </Button>
        </div>
      ) : (
        <div className="group relative" style={{ margin: "1.75rem 0" }}>
          {items.map((item, i) => {
            const last = i === items.length - 1;
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "16px 1fr", gap: "0 18px" }}>
                <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
                  <span style={{ width: "11px", height: "11px", borderRadius: "50%", marginTop: "5px", background: "var(--node-accent-safe, var(--page-accent, #64748b))", boxShadow: "0 0 0 4px var(--node-wash, transparent)", zIndex: 1 }} />
                  {!last && <span style={{ position: "absolute", top: "16px", bottom: "-6px", width: "2px", background: "var(--node-card-border, rgba(0,0,0,0.1))" }} />}
                </div>
                <div style={{ paddingBottom: last ? 0 : "22px" }}>
                  {item.label && <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--node-accent-safe, #64748b)", marginBottom: "3px" }}>{item.label}</div>}
                  <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--node-text, #17171a)", marginBottom: "3px" }}>{item.title}</div>
                  <div style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--node-muted, #64748b)" }}>{item.description}</div>
                </div>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit timeline"
            className="absolute top-0 right-0 flex h-8 w-8 items-center justify-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity bg-muted/80 hover:bg-muted rounded-full"
          >
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      )}
    </NodeViewWrapper>
  );
}
