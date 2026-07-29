"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

import { cn } from "@/lib/utils";
import {
  DEAL_STAGES,
  boardMovePatch,
  formatDealValue,
  type BoardColumnId,
  type BoardMovePatch,
} from "@/lib/deals";
import { DealCard } from "@/components/deals/deal-card";
import type { DealListItem } from "@/types";

export type DealMovePatch = BoardMovePatch;

interface DealBoardProps {
  deals: DealListItem[];
  onMove: (dealId: string, patch: DealMovePatch) => void;
}

function byCloseDate(a: DealListItem, b: DealListItem): number {
  if (!a.expectedCloseDate && !b.expectedCloseDate) return 0;
  if (!a.expectedCloseDate) return 1;
  if (!b.expectedCloseDate) return -1;
  return a.expectedCloseDate.localeCompare(b.expectedCloseDate);
}

function byClosedAtDesc(a: DealListItem, b: DealListItem): number {
  return (b.closedAt ?? "").localeCompare(a.closedAt ?? "");
}

function DraggableDealCard({
  deal,
  onOpen,
}: {
  deal: DealListItem;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: deal.id,
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="touch-none"
    >
      <DealCard deal={deal} onClick={onOpen} dragging={isDragging} />
    </div>
  );
}

function BoardColumn({
  id,
  label,
  deals,
  tone,
  onOpen,
}: {
  id: BoardColumnId;
  label: string;
  deals: DealListItem[];
  tone?: "success" | "muted";
  onOpen: (dealId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const total = deals.reduce((sum, d) => sum + (d.value ?? 0), 0);

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="flex items-center justify-between px-1 pb-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              tone === "success"
                ? "bg-success"
                : tone === "muted"
                  ? "bg-muted-foreground/50"
                  : "bg-primary/60"
            )}
          />
          {label}
          <span className="font-normal text-muted-foreground">{deals.length}</span>
        </span>
        {total > 0 && (
          <span className="text-2xs tabular-nums text-muted-foreground">
            {formatDealValue(total)}
          </span>
        )}
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[140px] flex-1 flex-col gap-2 rounded-xl border border-border/60 bg-muted/40 p-2 transition-colors",
          isOver && "border-primary/50 bg-accent"
        )}
      >
        {deals.map((deal) => (
          <DraggableDealCard
            key={deal.id}
            deal={deal}
            onOpen={() => onOpen(deal.id)}
          />
        ))}
      </div>
    </div>
  );
}

export function DealBoard({ deals, onMove }: DealBoardProps) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);

  // distance: 4 keeps plain clicks working as navigation on draggable cards.
  // Keyboard: focus a card, Enter/Space to lift, arrows to move, Enter to drop.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor)
  );

  const columns = useMemo(() => {
    const open = deals.filter((d) => d.status === "OPEN");
    return [
      ...DEAL_STAGES.map((s) => ({
        id: s.value as BoardColumnId,
        label: s.label,
        tone: undefined,
        deals: open.filter((d) => d.stage === s.value).sort(byCloseDate),
      })),
      {
        id: "WON" as BoardColumnId,
        label: "Won",
        tone: "success" as const,
        deals: deals.filter((d) => d.status === "WON").sort(byClosedAtDesc),
      },
      {
        id: "LOST" as BoardColumnId,
        label: "Lost",
        tone: "muted" as const,
        deals: deals.filter((d) => d.status === "LOST").sort(byClosedAtDesc),
      },
    ];
  }, [deals]);

  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const deal = deals.find((d) => d.id === active.id);
    if (!deal) return;
    const patch = boardMovePatch(deal, over.id as BoardColumnId);
    if (patch) onMove(deal.id, patch);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-3 overflow-x-auto pb-3">
        {columns.map((col) => (
          <BoardColumn
            key={col.id}
            id={col.id}
            label={col.label}
            tone={col.tone}
            deals={col.deals}
            onOpen={(dealId) => router.push(`/deals/${dealId}`)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeDeal ? (
          <div className="w-72">
            <DealCard deal={activeDeal} overlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
