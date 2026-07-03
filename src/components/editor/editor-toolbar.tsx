"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { cn } from "@/lib/utils";
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
  Plus,
  MousePointerClick,
  Globe,
  Table,
  LayoutGrid,
  FileText,
  UserRound,
  Megaphone,
  Quote as QuoteIcon,
  BarChart3,
  SeparatorHorizontal,
  type LucideIcon,
} from "lucide-react";
import { detectProvider } from "./extensions/embed-utils";
import { SWATCHES } from "@/lib/color-palettes";

// ---------------------------------------------------------------------------
// Block element definitions for the inserter
// ---------------------------------------------------------------------------
interface BlockDef {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  insert: (editor: Editor) => void;
}

const BLOCKS: BlockDef[] = [
  {
    id: "cta",
    label: "Button",
    description: "Call-to-action link",
    icon: MousePointerClick,
    insert: (editor) => {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "ctaButton",
          attrs: { label: "Click Here", url: "#" },
        })
        .run();
    },
  },
  {
    id: "embed",
    label: "Embed",
    description: "YouTube, Loom, Calendar",
    icon: Globe,
    insert: (editor) => {
      const url = window.prompt(
        "Enter embed URL (YouTube, Loom, Google Calendar, Drive, or PDF):"
      );
      if (url) {
        const info = detectProvider(url);
        editor
          .chain()
          .focus()
          .insertContent({
            type: "embed",
            attrs: { src: info.embedUrl, provider: info.provider },
          })
          .run();
      }
    },
  },
  {
    id: "table",
    label: "Table",
    description: "Data table with rows",
    icon: Table,
    insert: (editor) => {
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },
  {
    id: "image",
    label: "Image",
    description: "Full-width image",
    icon: ImageIcon,
    insert: (editor) => {
      const url = window.prompt("Enter image URL:");
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    },
  },
  {
    id: "logos",
    label: "Customer Logos",
    description: "Logo grid row",
    icon: LayoutGrid,
    insert: (editor) => {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "logoGrid",
          attrs: { logos: [] },
        })
        .run();
    },
  },
  {
    id: "form",
    label: "Form",
    description: "Lead capture form",
    icon: FileText,
    insert: (editor) => {
      const formId = `form_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      editor
        .chain()
        .focus()
        .insertContent({
          type: "formBlock",
          attrs: {
            formId,
            fields: [
              { id: "name", type: "text", label: "Name", required: true, preset: true },
              { id: "email", type: "email", label: "Email", required: true, preset: true },
            ],
            submitLabel: "Submit",
            successMessage: "Thank you!",
          },
        })
        .run();
    },
  },
  {
    id: "contact",
    label: "Contact Card",
    description: "Team member card",
    icon: UserRound,
    insert: (editor) => {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "contactCard",
          attrs: {
            contacts: [
              {
                id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                name: "",
                title: "",
                email: "",
                phone: "",
                photo: "",
              },
            ],
          },
        })
        .run();
    },
  },
  {
    id: "callout",
    label: "Callout",
    description: "Highlight bar",
    icon: Megaphone,
    insert: (editor) => {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "banner",
          attrs: {
            text: "Add your announcement here",
            emoji: "📢",
            bgStyle: "accent",
            link: "",
            linkLabel: "Learn more →",
          },
        })
        .run();
    },
  },
  {
    id: "testimonial",
    label: "Testimonial",
    description: "Quote with attribution",
    icon: QuoteIcon,
    insert: (editor) => {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "testimonial",
          attrs: {
            quote: "Add a testimonial quote here...",
            author: "",
            role: "",
            avatar: "",
          },
        })
        .run();
    },
  },
  {
    id: "metrics",
    label: "Metrics",
    description: "Key stats & numbers",
    icon: BarChart3,
    insert: (editor) => {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "metrics",
          attrs: {
            metrics: [
              { value: "99%", label: "Customer satisfaction" },
              { value: "3x", label: "Faster close rate" },
              { value: "50%", label: "Less follow-up time" },
            ],
          },
        })
        .run();
    },
  },
  {
    id: "spacer",
    label: "Spacer",
    description: "Vertical whitespace",
    icon: SeparatorHorizontal,
    insert: (editor) => {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "spacer",
          attrs: { height: "md" },
        })
        .run();
    },
  },
];

// ---------------------------------------------------------------------------
// ColorPicker — uses fixed positioning so it escapes the sticky z-index
// stacking context and is never clipped by any overflow on parent elements.
// ---------------------------------------------------------------------------
export function ColorPicker({ editor }: { editor: Editor }) {
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
      if (triggerRef.current?.contains(e.target as Node)) return;
      const portal = document.getElementById("color-picker-portal");
      if (portal?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Close on scroll
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
      <button
        ref={triggerRef}
        type="button"
        title="Text color"
        aria-label="Text color"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          <button
            type="button"
            onClick={clearColor}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "6px",
                    border: isActive
                      ? "2.5px solid hsl(var(--foreground))"
                      : "2px solid transparent",
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
// BlockInserter — visual dropdown to add rich elements
// ---------------------------------------------------------------------------
function BlockInserter({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    // Align dropdown to the right edge of the trigger, below it
    setPosition({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      const portal = document.getElementById("block-inserter-portal");
      if (portal?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Close on scroll
  useEffect(() => {
    if (!open) return;
    const onScroll = () => setOpen(false);
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open]);

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
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
          id="block-inserter-portal"
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
                  className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

// ---------------------------------------------------------------------------
// EditorToolbar
// ---------------------------------------------------------------------------
interface EditorToolbarProps {
  editor: Editor | null;
  className?: string;
}

export function EditorToolbar({ editor, className }: EditorToolbarProps) {
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
    <div className={cn("sticky top-0 z-10 bg-background border border-border rounded-xl p-1 flex flex-wrap items-center gap-0.5", className)}>
      {/* ── Text style ── */}
      <Button
        variant="ghost"
        size="sm"
        aria-label="Bold"
        aria-pressed={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        data-active={editor.isActive("bold")}
        className="data-[active=true]:bg-muted"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Italic"
        aria-pressed={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        data-active={editor.isActive("italic")}
        className="data-[active=true]:bg-muted"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Strikethrough"
        aria-pressed={editor.isActive("strike")}
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
        aria-label="Heading 1"
        aria-pressed={editor.isActive("heading", { level: 1 })}
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
        aria-label="Heading 2"
        aria-pressed={editor.isActive("heading", { level: 2 })}
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
        aria-label="Heading 3"
        aria-pressed={editor.isActive("heading", { level: 3 })}
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
        aria-label="Bullet list"
        aria-pressed={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        data-active={editor.isActive("bulletList")}
        className="data-[active=true]:bg-muted"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Ordered list"
        aria-pressed={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        data-active={editor.isActive("orderedList")}
        className="data-[active=true]:bg-muted"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Quote"
        aria-pressed={editor.isActive("blockquote")}
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
          <Button variant="ghost" size="sm" aria-label="Insert image">
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
        aria-label="Horizontal rule"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* ── History ── */}
      <Button
        variant="ghost"
        size="sm"
        aria-label="Undo"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Redo"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo className="h-4 w-4" />
      </Button>

      {/* ── Spacer pushes Add Element to the right ── */}
      <div className="flex-1" />

      {/* ── Block inserter ── */}
      <BlockInserter editor={editor} />
    </div>
  );
}
