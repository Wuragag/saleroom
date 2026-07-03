"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { Plus, GripVertical, Copy, Trash2, ArrowDownToLine } from "lucide-react";

interface HoverBlock {
  /** Offset of the block's top from the container top. */
  top: number;
  /** Document position of the start of the hovered top-level block. */
  pos: number;
}

/**
 * Notion-style left gutter that appears next to the hovered top-level block:
 *  - "+"  inserts a new block below and opens the slash-command picker
 *  - grip drags to reorder, or click for the block actions menu
 *    (add below / duplicate / delete)
 *
 * The gutter's hit area bridges to the content's left edge (via right padding)
 * so the pointer can travel onto the buttons without the container's
 * `mouseleave` firing and unmounting them — the reason the old "+" was
 * unclickable.
 *
 * Must be rendered inside a `position: relative` wrapper around EditorContent.
 */
export function BlockGutter({
  editor,
  containerRef,
}: {
  editor: Editor;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [hover, setHover] = useState<HoverBlock | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropTop, setDropTop] = useState<number | null>(null);

  const rafRef = useRef<number | null>(null);
  const menuOpenRef = useRef(false);
  menuOpenRef.current = menuOpen;
  const dragSourceRef = useRef<number | null>(null);
  const dropTargetRef = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const gripRef = useRef<HTMLButtonElement>(null);

  // Resolve the top-level block under a viewport point.
  const resolveBlock = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container || !editor.isEditable || editor.isDestroyed) return null;
      const dom = editor.view.dom as HTMLElement;
      const rect = dom.getBoundingClientRect();
      if (clientY < rect.top || clientY > rect.bottom) return null;

      const x = Math.min(Math.max(clientX, rect.left + 1), rect.right - 1);
      const coords = editor.view.posAtCoords({ left: x, top: clientY });
      if (!coords) return null;

      const $pos = editor.state.doc.resolve(coords.pos);
      const pos = $pos.depth === 0 ? coords.inside : $pos.before(1);
      if (pos < 0) return null;

      const nodeDom = editor.view.nodeDOM(pos);
      if (!(nodeDom instanceof HTMLElement)) return null;
      return { pos, nodeDom };
    },
    [editor, containerRef]
  );

  const cleanupDrag = useCallback(() => {
    dragSourceRef.current = null;
    dropTargetRef.current = null;
    setDropTop(null);
  }, []);

  // Pointer hover tracking + drag-and-drop handling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMove = (e: MouseEvent) => {
      if (menuOpenRef.current || dragSourceRef.current != null) return;
      if (rafRef.current != null) return;
      const cx = e.clientX, cy = e.clientY;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const res = resolveBlock(cx, cy);
        if (!res) return; // keep the previous handle rather than flicker
        const cRect = container.getBoundingClientRect();
        const bRect = res.nodeDom.getBoundingClientRect();
        setHover({ top: bRect.top - cRect.top, pos: res.pos });
      });
    };

    const onLeave = () => {
      if (menuOpenRef.current || dragSourceRef.current != null) return;
      setHover(null);
    };

    // Capture phase so we intercept the drop before ProseMirror's own handler.
    const onDragOver = (e: DragEvent) => {
      if (dragSourceRef.current == null) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";

      const res = resolveBlock(e.clientX, e.clientY);
      if (!res) return;
      const node = editor.state.doc.nodeAt(res.pos);
      if (!node) return;

      const cRect = container.getBoundingClientRect();
      const bRect = res.nodeDom.getBoundingClientRect();
      const before = e.clientY < bRect.top + bRect.height / 2;
      dropTargetRef.current = before ? res.pos : res.pos + node.nodeSize;
      setDropTop((before ? bRect.top : bRect.bottom) - cRect.top);
    };

    const onDrop = (e: DragEvent) => {
      if (dragSourceRef.current == null) return;
      e.preventDefault();
      e.stopPropagation();

      const from = dragSourceRef.current;
      const to = dropTargetRef.current;
      cleanupDrag();
      setHover(null);
      if (from == null || to == null) return;

      const { state, view } = editor;
      const node = state.doc.nodeAt(from);
      if (!node) return;
      // Dropped onto itself → no-op
      if (to >= from && to <= from + node.nodeSize) return;

      const tr = state.tr;
      tr.delete(from, from + node.nodeSize);
      const insertPos = tr.mapping.map(to);
      tr.insert(insertPos, node);
      view.dispatch(tr);
      editor.commands.focus();
    };

    container.addEventListener("mousemove", onMove);
    container.addEventListener("mouseleave", onLeave);
    container.addEventListener("dragover", onDragOver, true);
    container.addEventListener("drop", onDrop, true);
    return () => {
      container.removeEventListener("mousemove", onMove);
      container.removeEventListener("mouseleave", onLeave);
      container.removeEventListener("dragover", onDragOver, true);
      container.removeEventListener("drop", onDrop, true);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef, resolveBlock, editor, cleanupDrag]);

  // Close the actions menu on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || gripRef.current?.contains(t)) return;
      setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  if (!hover || !editor.isEditable) return null;

  const insertBelow = (pos: number) => {
    const node = editor.state.doc.nodeAt(pos);
    if (!node) return;
    const isEmptyParagraph =
      node.type.name === "paragraph" && node.content.size === 0;
    if (isEmptyParagraph) {
      editor
        .chain()
        .focus()
        .setTextSelection(pos + 1)
        .insertContent("/")
        .run();
    } else {
      const after = pos + node.nodeSize;
      editor
        .chain()
        .focus()
        .insertContentAt(after, { type: "paragraph" })
        .setTextSelection(after + 1)
        .insertContent("/")
        .run();
    }
    setMenuOpen(false);
    setHover(null);
  };

  const duplicate = (pos: number) => {
    const node = editor.state.doc.nodeAt(pos);
    if (!node) return;
    editor
      .chain()
      .focus()
      .insertContentAt(pos + node.nodeSize, node.toJSON())
      .run();
    setMenuOpen(false);
  };

  const remove = (pos: number) => {
    const node = editor.state.doc.nodeAt(pos);
    if (!node) return;
    if (editor.state.doc.childCount <= 1) {
      // Never leave an empty doc — replace the sole block with a paragraph
      editor
        .chain()
        .focus()
        .insertContentAt({ from: pos, to: pos + node.nodeSize }, { type: "paragraph" })
        .run();
    } else {
      editor
        .chain()
        .focus()
        .deleteRange({ from: pos, to: pos + node.nodeSize })
        .run();
    }
    setMenuOpen(false);
    setHover(null);
  };

  const onDragStart = (e: React.DragEvent) => {
    dragSourceRef.current = hover.pos;
    setMenuOpen(false);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", ""); // Firefox requires data
      const nodeDom = editor.view.nodeDOM(hover.pos);
      if (nodeDom instanceof HTMLElement) {
        try {
          e.dataTransfer.setDragImage(nodeDom, 12, 12);
        } catch {
          /* setDragImage can throw in some browsers — ignore */
        }
      }
    }
  };

  const dragging = dragSourceRef.current != null;

  return (
    <>
      {/* Gutter — hidden while dragging. pr-4 bridges the gap to the content
          edge so the pointer never crosses dead space to reach the buttons. */}
      {!dragging && (
        <div
          className="absolute z-20 hidden select-none flex-col gap-0.5 pr-4 md:flex"
          style={{ top: hover.top, left: -40 }}
        >
          <button
            type="button"
            onClick={() => insertBelow(hover.pos)}
            aria-label="Add block below"
            title="Add block below"
            className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            ref={gripRef}
            type="button"
            draggable
            onDragStart={onDragStart}
            onDragEnd={cleanupDrag}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Block options — drag to move"
            title="Drag to move · click for options"
            className="flex h-6 w-6 cursor-grab items-center justify-center rounded-md border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Actions menu */}
      {menuOpen && !dragging && (
        <div
          ref={menuRef}
          className="absolute z-30 w-44 overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg"
          style={{ top: hover.top + 28, left: -40 }}
        >
          <MenuItem
            icon={<ArrowDownToLine className="h-3.5 w-3.5" />}
            label="Add block below"
            onClick={() => insertBelow(hover.pos)}
          />
          <MenuItem
            icon={<Copy className="h-3.5 w-3.5" />}
            label="Duplicate"
            onClick={() => duplicate(hover.pos)}
          />
          <div className="my-1 h-px bg-border" />
          <MenuItem
            icon={<Trash2 className="h-3.5 w-3.5" />}
            label="Delete"
            destructive
            onClick={() => remove(hover.pos)}
          />
        </div>
      )}

      {/* Drop indicator */}
      {dropTop != null && (
        <div
          className="pointer-events-none absolute inset-x-0 z-30 h-0.5 rounded-full"
          style={{ top: dropTop, background: "var(--pub-accent, #64748b)" }}
          aria-hidden="true"
        />
      )}
    </>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-muted"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
