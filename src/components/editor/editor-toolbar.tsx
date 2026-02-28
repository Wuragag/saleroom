"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ImageIcon,
  Minus,
  Quote,
  Undo,
  Redo,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// ColorPicker — uses fixed positioning so it escapes the sticky z-index
// stacking context and is never clipped by any overflow on parent elements.
// ---------------------------------------------------------------------------
function ColorPicker({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const activeColor: string | undefined =
    editor.getAttributes("textStyle").color ?? undefined;

  // Reposition dropdown whenever it opens
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownStyle({ top: rect.bottom + 6, left: rect.left });
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      // If click is on the trigger, toggle logic handles it
      if (triggerRef.current?.contains(e.target as Node)) return;
      // If click is inside the dropdown portal, ignore
      const portal = document.getElementById("color-picker-portal");
      if (portal?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Close on scroll (reposition would be complex; just close)
  useEffect(() => {
    if (!open) return;
    const onScroll = () => setOpen(false);
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open]);

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
      {/* Trigger button — matches the h-9 height of shadcn Button size="sm" */}
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
        {/* "A" glyph — tinted when a color is active */}
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
        {/* Color indicator bar */}
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

      {/* Portal dropdown — fixed to viewport so it escapes any stacking context */}
      {open && dropdownStyle && (
        <div
          id="color-picker-portal"
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
          {/* Clear / no color */}
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

          {/* Divider */}
          <div
            style={{
              height: "1px",
              background: "hsl(var(--border))",
              marginBottom: "8px",
            }}
          />

          {/* 4-column swatch grid */}
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

// ---------------------------------------------------------------------------
// EditorToolbar
// ---------------------------------------------------------------------------
interface EditorToolbarProps {
  editor: Editor | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  if (!editor) return null;

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl("");
      setImageDialogOpen(false);
    }
  };

  return (
    <div className="sticky top-0 z-10 bg-background border border-border rounded-xl p-1 flex flex-wrap items-center gap-0.5">
      {/* ── Text style ── */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        data-active={editor.isActive("bold")}
        className="data-[active=true]:bg-muted"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        data-active={editor.isActive("italic")}
        className="data-[active=true]:bg-muted"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        data-active={editor.isActive("strike")}
        className="data-[active=true]:bg-muted"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>

      {/* ── Color picker ── */}
      <ColorPicker editor={editor} />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* ── Headings ── */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
        data-active={editor.isActive("heading", { level: 1 })}
        className="data-[active=true]:bg-muted"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        data-active={editor.isActive("heading", { level: 2 })}
        className="data-[active=true]:bg-muted"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
        data-active={editor.isActive("heading", { level: 3 })}
        className="data-[active=true]:bg-muted"
      >
        <Heading3 className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* ── Lists ── */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        data-active={editor.isActive("bulletList")}
        className="data-[active=true]:bg-muted"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        data-active={editor.isActive("orderedList")}
        className="data-[active=true]:bg-muted"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        data-active={editor.isActive("blockquote")}
        className="data-[active=true]:bg-muted"
      >
        <Quote className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* ── Image ── */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <ImageIcon className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Image</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            <Input
              placeholder="Paste image URL..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addImage()}
            />
            <Button onClick={addImage}>Add</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* ── History ── */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  );
}
