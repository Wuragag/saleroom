"use client";

import { useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check, Plus, Trash2 } from "lucide-react";

interface QA {
  question: string;
  answer: string;
}

export function FaqNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState<QA[]>(node.attrs.items ?? []);

  const save = () => {
    updateAttributes({ items });
    setEditing(false);
  };
  const update = (i: number, field: keyof QA, value: string) => {
    const next = [...items];
    next[i] = { ...next[i], [field]: value };
    setItems(next);
  };
  const add = () => items.length < 12 && setItems([...items, { question: "Question", answer: "Answer" }]);
  const remove = (i: number) => items.length > 1 && setItems(items.filter((_, j) => j !== i));

  return (
    <NodeViewWrapper data-type="faq" className={selected ? "ring-2 ring-primary rounded-xl" : ""}>
      {editing ? (
        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 space-y-1.5">
                <Input value={item.question} onChange={(e) => update(i, "question", e.target.value)} placeholder="Question" />
                <textarea
                  value={item.answer}
                  onChange={(e) => update(i, "answer", e.target.value)}
                  placeholder="Answer"
                  rows={2}
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>
              {items.length > 1 && (
                <button onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          {items.length < 12 && (
            <button onClick={add} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Plus className="h-3 w-3" /> Add question
            </button>
          )}
          <p className="text-3xs text-muted-foreground/70">Buyers see these as a collapsible list.</p>
          <Button size="sm" onClick={save} className="w-full">
            <Check className="h-3.5 w-3.5 mr-1.5" /> Done
          </Button>
        </div>
      ) : (
        <div className="group relative" style={{ margin: "1.75rem 0" }}>
          <div>
            {items.map((item, i) => (
              <div key={i} style={{ borderBottom: "1px solid var(--node-card-border, rgba(0,0,0,0.08))" }}>
                <div style={{ padding: "1rem 2rem 1rem 0", fontWeight: 600, color: "var(--node-text, #17171a)", position: "relative" }}>
                  {item.question}
                </div>
                <div style={{ padding: "0 2rem 1.125rem 0", color: "var(--node-muted, #64748b)", lineHeight: 1.7 }}>
                  {item.answer}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit FAQ"
            className="absolute top-0 right-0 flex h-8 w-8 items-center justify-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity bg-muted/80 hover:bg-muted rounded-full"
          >
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      )}
    </NodeViewWrapper>
  );
}
