"use client";

import { useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, AlertCircle } from "lucide-react";

/** The published page only links http(s) URLs (pub-nodes sanitizeUrl). */
const hasRealLink = (url: unknown) => /^https?:\/\//i.test(String(url ?? "").trim());

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
          <div className="group relative inline-flex items-center gap-3">
            <a
              className="inline-block px-8 py-3 font-semibold text-base cursor-default"
              style={{
                backgroundColor: "var(--page-accent, #003B22)",
                color: "var(--node-accent-ink, #ffffff)",
                borderRadius: "var(--pub-radius-sm, 9px)",
              }}
              onClick={(e) => e.preventDefault()}
            >
              {node.attrs.label}
            </a>
            {/* Editor-only hint: AI drafts often leave the CTA without a
                destination, and a dead button is the worst thing a buyer can
                click. Never rendered on the published page. */}
            {!hasRealLink(node.attrs.url) && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                contentEditable={false}
                className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning-subtle px-2 py-0.5 text-2xs font-medium text-warning-subtle-foreground"
              >
                <AlertCircle className="h-3 w-3" />
                No link yet
              </button>
            )}
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
