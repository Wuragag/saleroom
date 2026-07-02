"use client";

import { useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check, ExternalLink } from "lucide-react";

const STYLES = [
  { value: "accent",  label: "Accent",  preview: "bg-[var(--page-accent,#64748b)]" },
  { value: "subtle",  label: "Subtle",  preview: "bg-slate-100" },
  { value: "warning", label: "Warning", preview: "bg-amber-100" },
] as const;

type BgStyle = "accent" | "subtle" | "warning";

export function BannerNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const [editing, setEditing] = useState(false);
  const [text,      setText]      = useState<string>(node.attrs.text);
  const [emoji,     setEmoji]     = useState<string>(node.attrs.emoji);
  const [bgStyle,   setBgStyle]   = useState<BgStyle>(node.attrs.bgStyle);
  const [link,      setLink]      = useState<string>(node.attrs.link);
  const [linkLabel, setLinkLabel] = useState<string>(node.attrs.linkLabel);

  const save = () => {
    updateAttributes({ text, emoji, bgStyle, link, linkLabel });
    setEditing(false);
  };

  /* ── Preview colours in editor ── */
  const previewStyle: React.CSSProperties =
    bgStyle === "accent"
      ? { backgroundColor: "var(--page-accent, #003B22)", color: "#fff" }
      : bgStyle === "warning"
      ? { backgroundColor: "#fef3c7", color: "#92400e" }
      : { backgroundColor: "#f1f5f9", color: "#334155" };

  return (
    <NodeViewWrapper
      data-type="banner"
      className={selected ? "ring-2 ring-primary rounded-xl" : ""}
    >
      {editing ? (
        /* ── Edit panel ── */
        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
          {/* Emoji + text */}
          <div className="flex gap-2">
            <Input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="Emoji"
              className="w-16 text-center text-lg"
              maxLength={4}
            />
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Callout text…"
              className="flex-1"
            />
          </div>

          {/* Style picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium mr-1">Style</span>
            {STYLES.map((s) => (
              <button
                key={s.value}
                onClick={() => setBgStyle(s.value)}
                aria-pressed={bgStyle === s.value}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  bgStyle === s.value
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Optional link */}
          <div className="flex gap-2">
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Optional link URL (https://…)"
              className="flex-1"
            />
            <Input
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              placeholder="Link label"
              className="w-36"
            />
          </div>

          <Button size="sm" onClick={save} className="w-full">
            <Check className="h-3.5 w-3.5 mr-1.5" />
            Done
          </Button>
        </div>
      ) : (
        /* ── Banner preview ── */
        <div className="group relative rounded-xl overflow-hidden my-2" style={previewStyle}>
          <div className="flex items-center justify-between gap-4 px-5 py-3.5">
            <span className="text-sm font-semibold leading-snug">
              {node.attrs.emoji && (
                <span className="mr-2">{node.attrs.emoji}</span>
              )}
              {node.attrs.text}
            </span>

            {node.attrs.link && (
              <span
                className="shrink-0 text-xs font-bold underline underline-offset-2 opacity-90 flex items-center gap-1 cursor-default"
              >
                {node.attrs.linkLabel}
                <ExternalLink className="h-3 w-3" />
              </span>
            )}
          </div>

          {/* Edit button */}
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit banner"
            className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm"
          >
            <Pencil className="h-3 w-3" style={{ color: previewStyle.color }} />
          </button>
        </div>
      )}
    </NodeViewWrapper>
  );
}
