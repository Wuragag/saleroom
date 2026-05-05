"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { X } from "lucide-react";
import { useDismissable } from "@/hooks/use-dismissable";

const SWATCHES = [
  { label: "Black",     value: "#000000" },
  { label: "Dark Gray", value: "#374151" },
  { label: "Gray",      value: "#6B7280" },
  { label: "Silver",    value: "#D1D5DB" },
  { label: "Red",       value: "#EF4444" },
  { label: "Orange",    value: "#F97316" },
  { label: "Yellow",    value: "#EAB308" },
  { label: "Green",     value: "#22C55E" },
  { label: "Teal",      value: "#14B8A6" },
  { label: "Blue",      value: "#3B82F6" },
  { label: "Violet",    value: "#7C3AED" },
  { label: "Pink",      value: "#EC4899" },
];

/**
 * Text-color picker for the editor toolbar.
 * Uses fixed positioning so it escapes any overflow/z-index from parents.
 */
export function ColorPicker({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  const activeColor: string | undefined =
    editor.getAttributes("textStyle").color ?? undefined;

  // Reposition whenever it opens
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownStyle({ top: rect.bottom + 6, left: rect.left });
  }, [open]);

  const dismiss = useCallback(() => setOpen(false), []);
  useDismissable(open, dismiss, [triggerRef, portalRef]);

  const applyColor = useCallback(
    (color: string) => {
      editor.chain().focus().setColor(color).run();
      setOpen(false);
    },
    [editor]
  );

  const clearColor = useCallback(() => {
    editor.chain().focus().unsetColor().run();
    setOpen(false);
  }, [editor]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        title="Text color"
        aria-label="Text color"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "2px",
          height: "36px",
          width: "36px",
          borderRadius: "6px",
          border: "none",
          background: open ? "hsl(var(--muted))" : "transparent",
          cursor: "pointer",
          padding: 0,
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          if (!open)
            (e.currentTarget as HTMLButtonElement).style.background =
              "hsl(var(--muted))";
        }}
        onMouseLeave={(e) => {
          if (!open)
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
        }}
      >
        <span
          style={{
            fontSize: "13px",
            fontWeight: "700",
            lineHeight: 1,
            color: activeColor ?? "hsl(var(--foreground))",
            userSelect: "none",
          }}
        >
          A
        </span>
        <span
          style={{
            display: "block",
            height: "3px",
            width: "16px",
            borderRadius: "2px",
            background: activeColor ?? "hsl(var(--muted-foreground))",
            opacity: activeColor ? 1 : 0.35,
          }}
        />
      </button>

      {open && dropdownStyle && (
        <div
          ref={portalRef}
          style={{
            position: "fixed",
            top: dropdownStyle.top,
            left: dropdownStyle.left,
            zIndex: 99999,
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "12px",
            boxShadow:
              "0 10px 30px -6px rgba(0,0,0,0.18), 0 4px 8px -2px rgba(0,0,0,0.08)",
            padding: "10px",
            width: "140px",
          }}
        >
          <button
            type="button"
            onClick={clearColor}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              width: "100%",
              padding: "5px 7px",
              borderRadius: "6px",
              border: "none",
              background: !activeColor
                ? "hsl(var(--muted))"
                : "transparent",
              cursor: "pointer",
              fontSize: "11px",
              fontWeight: !activeColor ? "600" : "400",
              color: "hsl(var(--foreground))",
              marginBottom: "8px",
              fontFamily: "inherit",
              textAlign: "left",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                "hsl(var(--muted))")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                !activeColor ? "hsl(var(--muted))" : "transparent")
            }
          >
            <X
              style={{
                width: "11px",
                height: "11px",
                flexShrink: 0,
                color: "hsl(var(--muted-foreground))",
              }}
            />
            No color
          </button>

          <div
            style={{
              height: "1px",
              background: "hsl(var(--border))",
              marginBottom: "8px",
            }}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "4px",
            }}
          >
            {SWATCHES.map((swatch) => {
              const isActive =
                activeColor?.toLowerCase() === swatch.value.toLowerCase();
              return (
                <button
                  key={swatch.value}
                  type="button"
                  title={swatch.label}
                  aria-label={swatch.label}
                  aria-pressed={isActive}
                  onClick={() => applyColor(swatch.value)}
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "6px",
                    border: isActive
                      ? "2.5px solid hsl(var(--foreground))"
                      : "2px solid transparent",
                    outline: "none",
                    background: swatch.value,
                    cursor: "pointer",
                    transform: isActive ? "scale(1.15)" : "scale(1)",
                    transition: "transform 0.1s ease",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLButtonElement).style.transform =
                        "scale(1.12)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLButtonElement).style.transform =
                        "scale(1)";
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
