"use client";

import { useState } from "react";
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
} from "lucide-react";
import { ColorPicker } from "./toolbar-color-picker";
import { BlockInserter } from "./toolbar-block-inserter";

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

      {/* ── Spacer pushes Add Element to the right ── */}
      <div className="flex-1" />

      {/* ── Block inserter ── */}
      <BlockInserter editor={editor} />
    </div>
  );
}
