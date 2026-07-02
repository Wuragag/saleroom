"use client";

import { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2 } from "lucide-react";
import type { TabData } from "@/types";

interface SortableTabItemProps {
  tab: TabData;
  isActive: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}

export function SortableTabItem({
  tab,
  isActive,
  canDelete,
  onSelect,
  onRename,
  onDelete,
}: SortableTabItemProps) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [name, setName] = useState(tab.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const finishRename = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== tab.name) {
      onRename(trimmed);
    } else {
      setName(tab.name);
    }
    setEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-1 px-2 py-1.5 rounded-md text-sm cursor-pointer transition-colors ${
        isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
      }`}
      onClick={onSelect}
    >
      <button
        type="button"
        aria-label={`Reorder ${tab.name}`}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      {editing ? (
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={finishRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") finishRename();
            if (e.key === "Escape") {
              setName(tab.name);
              setEditing(false);
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 min-w-0 bg-transparent border-b border-foreground/30 outline-none text-sm px-0.5"
        />
      ) : (
        <span
          className="flex-1 min-w-0 truncate"
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
        >
          {tab.name}
        </span>
      )}

      {canDelete && !confirmingDelete && (
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Delete ${tab.name}`}
          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmingDelete(true);
          }}
        >
          <Trash2 className="h-3 w-3 text-muted-foreground" />
        </Button>
      )}

      {confirmingDelete && (
        <div
          className="flex items-center gap-1 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="text-xs text-destructive font-medium px-1 rounded-sm hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmingDelete(false);
              onDelete();
            }}
          >
            Delete
          </button>
          <button
            className="text-xs text-muted-foreground px-1 rounded-sm hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmingDelete(false);
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
