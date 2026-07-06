"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/icon-button";

interface Section {
  id: string;
  name: string;
  order: number;
}

interface StructurePanelProps {
  tabs: Section[];
  activeTabId: string;
  onSelect: (id: string) => void;
  onReorder: (ids: string[]) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

function SectionRow({
  tab,
  index,
  active,
  canDelete,
  onSelect,
  onRename,
  onDelete,
}: {
  tab: Section;
  index: number;
  active: boolean;
  canDelete: boolean;
  onSelect: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: tab.id });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(tab.name);

  // Seed the draft when editing starts (not at mount) so an external rename
  // (AI op, canvas tab bar) can't leave a stale draft that reverts it.
  const startEditing = () => {
    setDraft(tab.name);
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    const next = draft.trim();
    if (next && next !== tab.name) onRename(tab.id, next);
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex h-12 items-center gap-2.5 rounded-xl border px-2.5 transition-colors",
        active
          ? "border-border bg-card text-foreground shadow-elevation-1"
          : "border-transparent text-muted-foreground hover:bg-card/60 hover:text-foreground",
        isDragging && "opacity-60 shadow-elevation-2"
      )}
      onClick={() => onSelect(tab.id)}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        onClick={(e) => e.stopPropagation()}
        className="cursor-grab touch-none text-tertiary transition-colors hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="w-4 shrink-0 text-center text-2xs tabular-nums text-tertiary">
        {index + 1}
      </span>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
          onClick={(e) => e.stopPropagation()}
          className="min-w-0 flex-1 rounded-md border-[1.5px] border-border-strong bg-card px-2 py-1 text-small font-medium text-foreground focus:border-foreground focus:outline-none"
        />
      ) : (
        <span
          className="min-w-0 flex-1 truncate text-small font-medium"
          onDoubleClick={(e) => {
            e.stopPropagation();
            startEditing();
          }}
        >
          {tab.name}
        </span>
      )}
      {canDelete && (
        <IconButton
          size="sm"
          aria-label={`Delete ${tab.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(tab.id);
          }}
          className="h-7 w-7 shrink-0 rounded-md text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </IconButton>
      )}
    </div>
  );
}

/**
 * Structure tab of the AI panel: a live, drag-and-drop list of the page's
 * sections (tabs). Reorder, rename (double-click), delete, and add — all wired
 * to the editor through the AI bridge so the canvas updates immediately.
 */
export function StructurePanel({
  tabs,
  activeTabId,
  onSelect,
  onReorder,
  onRename,
  onDelete,
  onAdd,
}: StructurePanelProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = tabs.map((t) => t.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(ids, oldIndex, newIndex));
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto px-3 py-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={tabs.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-1.5">
            {tabs.map((tab, i) => (
              <SectionRow
                key={tab.id}
                tab={tab}
                index={i}
                active={tab.id === activeTabId}
                canDelete={tabs.length > 1}
                onSelect={onSelect}
                onRename={onRename}
                onDelete={onDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        onClick={onAdd}
        className="mt-2 flex h-11 items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong text-small font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
      >
        <Plus className="h-4 w-4" />
        Add section
      </button>
    </div>
  );
}
