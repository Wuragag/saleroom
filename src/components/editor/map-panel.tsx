"use client";

import { useState } from "react";
import { Plus, Trash2, Calendar, User, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMap } from "@/hooks/use-map";
import type { MapItemData } from "@/types";

interface MapPanelProps {
  pageId: string;
}

export function MapPanel({ pageId }: MapPanelProps) {
  const {
    map,
    loading,
    enableMap,
    disableMap,
    updateMap,
    addItem,
    updateItem,
    deleteItem,
  } = useMap(pageId);

  const [expanded, setExpanded] = useState(true);

  if (loading) return null;

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          Action Plan
        </h3>
        {map ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        ) : null}
      </div>

      {!map ? (
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground">
            Add a shared action plan to track milestones with your buyer.
          </p>
          <Button size="sm" className="h-6 text-xs w-full" onClick={enableMap}>
            Enable Action Plan
          </Button>
        </div>
      ) : expanded ? (
        <MapEditor
          map={map}
          onUpdateMap={updateMap}
          onAddItem={addItem}
          onUpdateItem={updateItem}
          onDeleteItem={deleteItem}
          onDisable={disableMap}
        />
      ) : (
        <p className="text-[10px] text-muted-foreground">
          {map.items.length} item{map.items.length !== 1 ? "s" : ""} ·{" "}
          {map.items.filter((i) => i.completed).length} done
        </p>
      )}
    </div>
  );
}

// ── Inline editor for the MAP ──

interface MapEditorProps {
  map: { title: string; closeDate: string | null; items: MapItemData[] };
  onUpdateMap: (patch: { title?: string; closeDate?: string | null }) => void;
  onAddItem: (item: {
    title: string;
    ownerType: "seller" | "buyer";
    ownerName: string;
    dueDate?: string | null;
  }) => void;
  onUpdateItem: (itemId: string, patch: Partial<MapItemData>) => void;
  onDeleteItem: (itemId: string) => void;
  onDisable: () => void;
}

function MapEditor({
  map,
  onUpdateMap,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onDisable,
}: MapEditorProps) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newOwnerType, setNewOwnerType] = useState<"seller" | "buyer">("seller");
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newDueDate, setNewDueDate] = useState("");

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    onAddItem({
      title: newTitle.trim(),
      ownerType: newOwnerType,
      ownerName: newOwnerName.trim(),
      dueDate: newDueDate || null,
    });
    setNewTitle("");
    setNewOwnerName("");
    setNewDueDate("");
    setAdding(false);
  };

  const completedCount = map.items.filter((i) => i.completed).length;
  const totalCount = map.items.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-2">
      {/* Title */}
      <input
        value={map.title}
        onChange={(e) => onUpdateMap({ title: e.target.value })}
        placeholder="Plan title"
        className="w-full text-xs px-1.5 py-1 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring font-medium"
      />

      {/* Close date */}
      <div className="flex items-center gap-1.5">
        <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        <input
          type="date"
          value={map.closeDate ? map.closeDate.split("T")[0] : ""}
          onChange={(e) =>
            onUpdateMap({ closeDate: e.target.value || null })
          }
          className="flex-1 text-xs px-1.5 py-1 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring text-muted-foreground"
          placeholder="Target close date"
        />
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="space-y-0.5">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{completedCount}/{totalCount} complete</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Items */}
      <div className="space-y-1">
        {map.items.map((item) => (
          <MapItemRow
            key={item.id}
            item={item}
            onUpdate={(patch) => onUpdateItem(item.id, patch)}
            onDelete={() => onDeleteItem(item.id)}
          />
        ))}
      </div>

      {/* Add item */}
      {adding ? (
        <div className="space-y-1.5 pt-1 border-t border-border">
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Task title"
            className="w-full text-xs px-1.5 py-1 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") setAdding(false);
            }}
          />
          <div className="flex gap-1">
            <select
              value={newOwnerType}
              onChange={(e) => setNewOwnerType(e.target.value as "seller" | "buyer")}
              className="text-xs px-1.5 py-1 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="seller">Seller</option>
              <option value="buyer">Buyer</option>
            </select>
            <input
              value={newOwnerName}
              onChange={(e) => setNewOwnerName(e.target.value)}
              placeholder="Name"
              className="flex-1 text-xs px-1.5 py-1 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <input
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            className="w-full text-xs px-1.5 py-1 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring text-muted-foreground"
          />
          <div className="flex gap-1">
            <Button size="sm" className="h-6 text-xs flex-1" onClick={handleAdd}>
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs flex-1"
              onClick={() => setAdding(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start rounded-lg text-muted-foreground hover:text-foreground h-7 text-xs"
          onClick={() => setAdding(true)}
        >
          <Plus className="h-3 w-3 mr-1.5" />
          Add Item
        </Button>
      )}

      {/* Disable */}
      <button
        onClick={onDisable}
        className="w-full text-[10px] text-muted-foreground hover:text-destructive transition-colors pt-1"
      >
        Remove Action Plan
      </button>
    </div>
  );
}

// ── Single item row ──

function MapItemRow({
  item,
  onUpdate,
  onDelete,
}: {
  item: MapItemData;
  onUpdate: (patch: Partial<MapItemData>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);

  const ownerBadge = item.ownerType === "buyer"
    ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";

  if (editing) {
    return (
      <div className="space-y-1 p-1.5 rounded-lg bg-muted/50 border border-border">
        <input
          autoFocus
          value={item.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="w-full text-xs px-1.5 py-1 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <div className="flex gap-1">
          <select
            value={item.ownerType}
            onChange={(e) => onUpdate({ ownerType: e.target.value as "seller" | "buyer" })}
            className="text-xs px-1.5 py-1 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="seller">Seller</option>
            <option value="buyer">Buyer</option>
          </select>
          <input
            value={item.ownerName}
            onChange={(e) => onUpdate({ ownerName: e.target.value })}
            placeholder="Name"
            className="flex-1 text-xs px-1.5 py-1 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <input
          type="date"
          value={item.dueDate ? item.dueDate.split("T")[0] : ""}
          onChange={(e) => onUpdate({ dueDate: e.target.value || null })}
          className="w-full text-xs px-1.5 py-1 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring text-muted-foreground"
        />
        <Button size="sm" className="h-6 text-xs w-full" onClick={() => setEditing(false)}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-1.5 py-0.5">
      <input
        type="checkbox"
        checked={item.completed}
        onChange={(e) => onUpdate({ completed: e.target.checked })}
        className="mt-0.5 h-3.5 w-3.5 rounded border-border accent-primary flex-shrink-0"
      />
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => setEditing(true)}
      >
        <p
          className={`text-xs leading-tight ${
            item.completed ? "line-through text-muted-foreground" : "text-foreground"
          }`}
        >
          {item.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`text-[9px] px-1 py-0 rounded ${ownerBadge}`}>
            {item.ownerType === "buyer" ? "Buyer" : "Seller"}
          </span>
          {item.ownerName && (
            <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
              <User className="h-2 w-2" />
              {item.ownerName}
            </span>
          )}
          {item.dueDate && (
            <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
              <Calendar className="h-2 w-2" />
              {new Date(item.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onDelete}
        className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
