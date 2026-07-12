"use client";

import { useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check } from "lucide-react";

export function QuoteHeroNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const [editing, setEditing] = useState(false);
  const [quote, setQuote] = useState<string>(node.attrs.quote ?? "");
  const [author, setAuthor] = useState<string>(node.attrs.author ?? "");
  const [role, setRole] = useState<string>(node.attrs.role ?? "");

  const save = () => {
    updateAttributes({ quote, author, role });
    setEditing(false);
  };

  return (
    <NodeViewWrapper
      data-type="quote-hero"
      className={selected ? "ring-2 ring-primary rounded-xl" : ""}
    >
      {editing ? (
        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
          <textarea
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder="The quote…"
            rows={3}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          <div className="flex gap-2">
            <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author" className="flex-1" />
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role / company" className="flex-1" />
          </div>
          <Button size="sm" onClick={save} className="w-full">
            <Check className="h-3.5 w-3.5 mr-1.5" /> Done
          </Button>
        </div>
      ) : (
        <div className="group relative" style={{ margin: "3rem 0" }}>
          <div
            aria-hidden="true"
            style={{
              fontFamily: "var(--pub-font-heading, var(--pub-font-body, serif))",
              fontSize: "64px",
              lineHeight: 0.8,
              color: "var(--node-accent-safe, var(--page-accent, #64748b))",
              opacity: 0.25,
              marginBottom: "4px",
            }}
          >
            &ldquo;
          </div>
          <div
            style={{
              fontFamily: "var(--pub-font-heading, var(--pub-font-body, inherit))",
              fontSize: "clamp(1.5rem, 3.6vw, 2.25rem)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.25,
              color: "var(--node-text, #17171a)",
            }}
          >
            {node.attrs.quote}
          </div>
          {(node.attrs.author || node.attrs.role) && (
            <div
              style={{
                marginTop: "16px",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--node-muted, #64748b)",
              }}
            >
              — {node.attrs.author}
              {node.attrs.role ? ` · ${node.attrs.role}` : ""}
            </div>
          )}

          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit quote"
            className="absolute top-0 right-0 flex h-8 w-8 items-center justify-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity bg-muted/80 hover:bg-muted rounded-full"
          >
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      )}
    </NodeViewWrapper>
  );
}
