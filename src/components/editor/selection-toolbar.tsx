"use client";

import { useState, useRef, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { isTextSelection } from "@tiptap/core";
import {
  Bold,
  Italic,
  Strikethrough,
  Quote,
  Pilcrow,
  Link2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ColorPicker } from "./editor-toolbar";

/** Allow only safe link protocols; auto-prefix bare domains with https://. */
function sanitizeHref(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^\s*(javascript|data|vbscript):/i.test(trimmed)) return "";
  if (
    /^https?:\/\//i.test(trimmed) ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("#")
  ) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Floating formatting toolbar that appears over selected text — the
 * quick-format path so users don't have to travel to the sticky toolbar.
 */
export function SelectionToolbar({ editor }: { editor: Editor }) {
  const [linkMode, setLinkMode] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const linkInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (linkMode) linkInputRef.current?.focus();
  }, [linkMode]);

  // Close the link editor whenever the user moves the selection elsewhere
  // (typing in the URL input doesn't fire selectionUpdate).
  useEffect(() => {
    const close = () => setLinkMode(false);
    editor.on("selectionUpdate", close);
    return () => {
      editor.off("selectionUpdate", close);
    };
  }, [editor]);

  const openLinkEditor = () => {
    setLinkUrl(editor.getAttributes("link").href ?? "");
    setLinkMode(true);
  };

  const applyLink = () => {
    const href = sanitizeHref(linkUrl);
    if (href) {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    } else {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    }
    setLinkMode(false);
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkMode(false);
  };

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "top", offset: 8 }}
      shouldShow={({ editor: e, state }) => {
        // Text selections only — custom blocks have their own edit chrome,
        // and empty selections shouldn't summon the toolbar.
        if (!e.isEditable) return false;
        const { selection } = state;
        if (selection.empty || !isTextSelection(selection)) return false;
        // Skip code blocks — marks don't apply there
        if (e.isActive("codeBlock")) return false;
        return true;
      }}
      className="z-50 flex items-center gap-0.5 rounded-xl border border-border bg-background/95 p-1 shadow-lg backdrop-blur"
    >
      {linkMode ? (
        <div className="flex items-center gap-1 px-1">
          <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            ref={linkInputRef}
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setLinkMode(false);
              }
            }}
            placeholder="Paste or type a link…"
            className="h-8 w-56 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button
            variant="ghost"
            size="sm"
            aria-label="Apply link"
            onClick={applyLink}
            className="h-8 w-8 p-0"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          {editor.isActive("link") && (
            <Button
              variant="ghost"
              size="sm"
              aria-label="Remove link"
              onClick={removeLink}
              className="h-8 w-8 p-0 text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ) : (
      <>
      {/* Turn into */}
      <Button
        variant="ghost"
        size="sm"
        aria-label="Paragraph"
        aria-pressed={editor.isActive("paragraph")}
        onClick={() => editor.chain().focus().setParagraph().run()}
        data-active={editor.isActive("paragraph") && !editor.isActive("blockquote")}
        className="h-8 w-8 p-0 data-[active=true]:bg-muted"
      >
        <Pilcrow className="h-3.5 w-3.5" />
      </Button>
      {([1, 2, 3] as const).map((level) => (
        <Button
          key={level}
          variant="ghost"
          size="sm"
          aria-label={`Heading ${level}`}
          aria-pressed={editor.isActive("heading", { level })}
          onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
          data-active={editor.isActive("heading", { level })}
          className="h-8 w-8 p-0 text-xs font-semibold data-[active=true]:bg-muted"
        >
          H{level}
        </Button>
      ))}

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      {/* Marks */}
      <Button
        variant="ghost"
        size="sm"
        aria-label="Bold"
        aria-pressed={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        data-active={editor.isActive("bold")}
        className="h-8 w-8 p-0 data-[active=true]:bg-muted"
      >
        <Bold className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Italic"
        aria-pressed={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        data-active={editor.isActive("italic")}
        className="h-8 w-8 p-0 data-[active=true]:bg-muted"
      >
        <Italic className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Strikethrough"
        aria-pressed={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        data-active={editor.isActive("strike")}
        className="h-8 w-8 p-0 data-[active=true]:bg-muted"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </Button>

      <ColorPicker editor={editor} />

      <Button
        variant="ghost"
        size="sm"
        aria-label="Link"
        aria-pressed={editor.isActive("link")}
        onClick={openLinkEditor}
        data-active={editor.isActive("link")}
        className="h-8 w-8 p-0 data-[active=true]:bg-muted"
      >
        <Link2 className="h-3.5 w-3.5" />
      </Button>

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      <Button
        variant="ghost"
        size="sm"
        aria-label="Quote"
        aria-pressed={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        data-active={editor.isActive("blockquote")}
        className="h-8 w-8 p-0 data-[active=true]:bg-muted"
      >
        <Quote className="h-3.5 w-3.5" />
      </Button>
      </>
      )}
    </BubbleMenu>
  );
}
