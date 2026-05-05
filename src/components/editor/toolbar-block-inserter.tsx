"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { Plus } from "lucide-react";
import { useDismissable } from "@/hooks/use-dismissable";
import { BLOCKS, type BlockDef } from "./toolbar-blocks";

/**
 * Visual dropdown for inserting rich blocks (button, embed, table, etc.).
 */
export function BlockInserter({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    // Right-edge alignment, below the trigger
    setPosition({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
  }, [open]);

  const dismiss = useCallback(() => setOpen(false), []);
  useDismissable(open, dismiss, [triggerRef, portalRef]);

  const handleInsert = useCallback(
    (block: BlockDef) => {
      block.insert(editor);
      setOpen(false);
    },
    [editor]
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Add element"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold transition-colors shrink-0"
        style={{
          border: "none",
          background: open ? "hsl(var(--primary))" : "hsl(var(--primary))",
          color: "hsl(var(--primary-foreground))",
          cursor: "pointer",
          opacity: open ? 0.9 : 1,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = "0.85";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = open ? "0.9" : "1";
        }}
      >
        <Plus style={{ width: "14px", height: "14px" }} />
        Add Element
      </button>

      {open && position && (
        <div
          ref={portalRef}
          style={{
            position: "fixed",
            top: position.top,
            right: position.right,
            zIndex: 99999,
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "14px",
            boxShadow:
              "0 16px 48px -8px rgba(0,0,0,0.2), 0 4px 12px -2px rgba(0,0,0,0.08)",
            padding: "8px",
            width: "320px",
          }}
        >
          <div
            style={{
              padding: "6px 10px 8px",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: "hsl(var(--muted-foreground))",
            }}
          >
            Elements
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "4px",
            }}
          >
            {BLOCKS.map((block) => {
              const Icon = block.icon;
              return (
                <button
                  key={block.id}
                  type="button"
                  onClick={() => handleInsert(block)}
                  className="group"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    fontFamily: "inherit",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "hsl(var(--muted))";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "transparent";
                  }}
                >
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "8px",
                      background: "hsl(var(--muted))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon
                      style={{
                        width: "16px",
                        height: "16px",
                        color: "hsl(var(--foreground))",
                        opacity: 0.7,
                      }}
                    />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "12.5px",
                        fontWeight: 600,
                        color: "hsl(var(--foreground))",
                        lineHeight: 1.2,
                      }}
                    >
                      {block.label}
                    </div>
                    <div
                      style={{
                        fontSize: "10.5px",
                        color: "hsl(var(--muted-foreground))",
                        lineHeight: 1.3,
                        marginTop: "1px",
                      }}
                    >
                      {block.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
