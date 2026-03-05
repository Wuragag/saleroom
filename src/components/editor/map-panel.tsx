"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, CheckCircle2, Circle, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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

  const [collapsed, setCollapsed] = useState(false);

  if (loading) return null;

  if (!map) {
    return (
      <div className="mt-6 border border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center">
        <ClipboardList className="h-8 w-8 text-muted-foreground mb-3" />
        <h3 className="text-sm font-semibold text-foreground mb-1">
          Mutual Action Plan
        </h3>
        <p className="text-xs text-muted-foreground mb-4 max-w-sm">
          Add a shared action plan to track milestones with your buyer. Both sides can see progress and check off tasks.
        </p>
        <Button size="sm" onClick={enableMap}>
          Enable Action Plan
        </Button>
      </div>
    );
  }

  const completedCount = map.items.filter((i) => i.completed).length;
  const totalCount = map.items.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="mt-6 border border-border rounded-xl bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Action Plan</h3>
          {totalCount > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {completedCount}/{totalCount} complete · {progress}%
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
        >
          {collapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </button>
      </div>

      {!collapsed && (
        <div className="p-5 space-y-5">
          {/* Title + Close Date row */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Plan Title
              </label>
              <input
                value={map.title}
                onChange={(e) => updateMap({ title: e.target.value })}
                placeholder="Mutual Action Plan"
                className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring font-medium"
              />
            </div>
            <div className="w-52">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Target Close Date
              </label>
              <DatePicker
                value={map.closeDate ? new Date(map.closeDate) : null}
                onChange={(date) => updateMap({ closeDate: date ? date.toISOString().split("T")[0] : null })}
                placeholder="Set close date"
                className="w-full"
              />
            </div>
          </div>

          {/* Progress bar */}
          {totalCount > 0 && (
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Items table */}
          {map.items.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[32px_1fr_110px_130px_120px_36px] gap-0 text-[11px] font-medium text-muted-foreground uppercase tracking-wider bg-muted/50 border-b border-border">
                <div className="px-2 py-2.5" />
                <div className="px-3 py-2.5">Task</div>
                <div className="px-3 py-2.5">Owner</div>
                <div className="px-3 py-2.5">Assigned To</div>
                <div className="px-3 py-2.5">Due Date</div>
                <div className="px-2 py-2.5" />
              </div>

              {/* Items */}
              {map.items.map((item, i) => (
                <MapItemRow
                  key={item.id}
                  item={item}
                  isLast={i === map.items.length - 1}
                  onUpdate={(patch) => updateItem(item.id, patch)}
                  onDelete={() => deleteItem(item.id)}
                />
              ))}
            </div>
          )}

          {/* Add item inline */}
          <AddItemRow onAdd={addItem} />

          {/* Disable action plan */}
          <div className="flex justify-end">
            <button
              onClick={disableMap}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Remove Action Plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Single item row ──

function MapItemRow({
  item,
  isLast,
  onUpdate,
  onDelete,
}: {
  item: MapItemData;
  isLast: boolean;
  onUpdate: (patch: Partial<MapItemData>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const isOverdue = item.dueDate && !item.completed && new Date(item.dueDate) < new Date();

  return (
    <div
      className={`group grid grid-cols-[32px_1fr_110px_130px_120px_36px] gap-0 items-center hover:bg-muted/30 transition-colors ${
        !isLast ? "border-b border-border" : ""
      }`}
    >
      {/* Checkbox */}
      <div className="px-2 py-2.5 flex justify-center">
        <button
          onClick={() => onUpdate({ completed: !item.completed })}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {item.completed ? (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          ) : (
            <Circle className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Title */}
      <div className="px-3 py-2.5">
        {editing ? (
          <input
            autoFocus
            value={item.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape") setEditing(false);
            }}
            className="w-full text-sm px-2 py-1 -ml-2 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        ) : (
          <span
            onClick={() => setEditing(true)}
            className={`text-sm cursor-pointer ${
              item.completed
                ? "line-through text-muted-foreground"
                : "text-foreground"
            }`}
          >
            {item.title}
          </span>
        )}
      </div>

      {/* Owner type */}
      <div className="px-3 py-2.5">
        <select
          value={item.ownerType}
          onChange={(e) => onUpdate({ ownerType: e.target.value as "seller" | "buyer" })}
          className="text-xs px-2 py-1 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring w-full"
        >
          <option value="seller">Seller</option>
          <option value="buyer">Buyer</option>
        </select>
      </div>

      {/* Owner name */}
      <div className="px-3 py-2.5">
        <input
          value={item.ownerName}
          onChange={(e) => onUpdate({ ownerName: e.target.value })}
          placeholder="Name"
          className="w-full text-xs px-2 py-1 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Due date */}
      <div className="px-3 py-2.5">
        <DatePicker
          value={item.dueDate ? new Date(item.dueDate) : null}
          onChange={(date) => onUpdate({ dueDate: date ? date.toISOString().split("T")[0] : null })}
          placeholder="Due date"
          compact
          className={cn("w-full", isOverdue && "text-red-500 border-red-200")}
        />
      </div>

      {/* Delete */}
      <div className="px-2 py-2.5 flex justify-center">
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Inline add-item row ──

function AddItemRow({
  onAdd,
}: {
  onAdd: (item: {
    title: string;
    ownerType: "seller" | "buyer";
    ownerName: string;
    dueDate?: string | null;
  }) => void;
}) {
  const [active, setActive] = useState(false);
  const [title, setTitle] = useState("");
  const [ownerType, setOwnerType] = useState<"seller" | "buyer">("seller");
  const [ownerName, setOwnerName] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      ownerType,
      ownerName: ownerName.trim(),
      dueDate: dueDate || null,
    });
    setTitle("");
    setOwnerName("");
    setDueDate("");
    // Keep active so user can add multiple items quickly
  };

  if (!active) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-muted-foreground hover:text-foreground"
        onClick={() => setActive(true)}
      >
        <Plus className="h-3.5 w-3.5 mr-2" />
        Add Item
      </Button>
    );
  }

  return (
    <div className="border border-border rounded-lg p-3 bg-muted/20 space-y-3">
      <div className="grid grid-cols-[1fr_110px_130px_120px] gap-2 items-end">
        <div>
          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Task</label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to happen?"
            className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") setActive(false);
            }}
          />
        </div>
        <div>
          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Owner</label>
          <select
            value={ownerType}
            onChange={(e) => setOwnerType(e.target.value as "seller" | "buyer")}
            className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="seller">Seller</option>
            <option value="buyer">Buyer</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Assigned To</label>
          <input
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="Name"
            className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Due Date</label>
          <DatePicker
            value={dueDate ? new Date(dueDate) : null}
            onChange={(date) => setDueDate(date ? date.toISOString().split("T")[0] : "")}
            placeholder="Due date"
            className="w-full"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleAdd}>
          Add Item
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setActive(false)}>
          Done
        </Button>
      </div>
    </div>
  );
}
