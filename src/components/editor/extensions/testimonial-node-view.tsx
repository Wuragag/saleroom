"use client";

import { useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check } from "lucide-react";

export function TestimonialNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const [editing, setEditing] = useState(false);
  const [quote, setQuote] = useState<string>(node.attrs.quote);
  const [author, setAuthor] = useState<string>(node.attrs.author);
  const [role, setRole] = useState<string>(node.attrs.role);
  const [avatar, setAvatar] = useState<string>(node.attrs.avatar);

  const save = () => {
    updateAttributes({ quote, author, role, avatar });
    setEditing(false);
  };

  return (
    <NodeViewWrapper
      data-type="testimonial"
      className={selected ? "ring-2 ring-primary rounded-xl" : ""}
    >
      {editing ? (
        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
          <textarea
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder="Testimonial quote..."
            className="w-full min-h-[80px] px-3 py-2 text-sm rounded-lg border border-border bg-card resize-vertical focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          <div className="flex gap-2">
            <Input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author name"
              className="flex-1"
            />
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Title / Company"
              className="flex-1"
            />
          </div>
          <Input
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="Avatar image URL (optional)"
          />
          <Button size="sm" onClick={save} className="w-full">
            <Check className="h-3.5 w-3.5 mr-1.5" />
            Done
          </Button>
        </div>
      ) : (
        <div className="group relative my-2">
          <div
            className="rounded-xl border border-border bg-card/60 p-6"
            style={{ borderLeft: "4px solid var(--page-accent, #64748b)" }}
          >
            {/* Quote mark */}
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              className="mb-3 opacity-20"
            >
              <path
                d="M10 8H6C4.89543 8 4 8.89543 4 10V14C4 15.1046 4.89543 16 6 16H8L6 20H8.5L10.5 16H10C11.1046 16 12 15.1046 12 14V10C12 8.89543 11.1046 8 10 8Z"
                fill="currentColor"
              />
              <path
                d="M20 8H16C14.8954 8 14 8.89543 14 10V14C14 15.1046 14.8954 16 16 16H18L16 20H18.5L20.5 16H20C21.1046 16 22 15.1046 22 14V10C22 8.89543 21.1046 8 20 8Z"
                fill="currentColor"
              />
            </svg>

            <p className="text-base leading-relaxed text-foreground/90 mb-4 italic">
              &ldquo;{node.attrs.quote}&rdquo;
            </p>

            <div className="flex items-center gap-3">
              {node.attrs.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={node.attrs.avatar}
                  alt={node.attrs.author}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : node.attrs.author ? (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: "var(--page-accent, #64748b)" }}
                >
                  {node.attrs.author
                    .split(" ")
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
              ) : null}
              <div>
                {node.attrs.author && (
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    {node.attrs.author}
                  </p>
                )}
                {node.attrs.role && (
                  <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                    {node.attrs.role}
                  </p>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setEditing(true)}
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-muted/80 hover:bg-muted rounded-full p-1.5"
          >
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      )}
    </NodeViewWrapper>
  );
}
