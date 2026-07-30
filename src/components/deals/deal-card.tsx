"use client";

import { FileText, CalendarDays } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDealValue, formatStageAge, isOverdue } from "@/lib/deals";
import { formatRelativeTime } from "@/lib/format-utils";
import { memberDisplayName } from "@/components/deals/member-picker";
import type { DealListItem, IntentLabel } from "@/types";

const INTENT_VARIANT: Record<IntentLabel, "success" | "warning" | "neutral"> = {
  "High Intent": "success",
  Warm: "warning",
  Cold: "neutral",
};

export function formatCloseDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** The deal pulse chip: intent + recency, or a quiet "no activity" note. */
export function DealPulse({ deal }: { deal: Pick<DealListItem, "engagement"> }) {
  const { intent, lastActivityAt } = deal.engagement;
  if (!intent) {
    return (
      <span className="text-2xs text-muted-foreground">No buyer activity yet</span>
    );
  }
  return (
    <span className="flex items-center gap-1.5">
      <Badge variant={INTENT_VARIANT[intent]}>{intent}</Badge>
      {lastActivityAt && (
        <span className="text-2xs text-muted-foreground whitespace-nowrap">
          {formatRelativeTime(lastActivityAt)}
        </span>
      )}
    </span>
  );
}

interface DealCardProps {
  deal: DealListItem;
  onClick?: () => void;
  /** Rendered inside a DragOverlay — lifts the card visually. */
  overlay?: boolean;
  dragging?: boolean;
}

export function DealCard({ deal, onClick, overlay, dragging }: DealCardProps) {
  const overdue = isOverdue(deal);
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border border-border bg-card p-3 shadow-elevation-1 transition-shadow select-none",
        onClick && "cursor-pointer hover:shadow-elevation-2",
        overlay && "shadow-elevation-3 rotate-1",
        dragging && "opacity-40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-medium text-foreground">
          {deal.name}
        </p>
        {deal.value !== null && (
          <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
            {formatDealValue(deal.value)}
          </span>
        )}
      </div>
      {deal.company && (
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {deal.company}
        </p>
      )}

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <DealPulse deal={deal} />
        {deal.status === "OPEN" && (
          <span className="shrink-0 text-2xs tabular-nums text-muted-foreground">
            {formatStageAge(deal.stageEnteredAt)} in stage
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border pt-2 text-2xs text-muted-foreground">
        <span className="flex min-w-0 items-center gap-1.5">
          <Avatar
            name={memberDisplayName(deal.owner)}
            src={deal.owner.avatarUrl || null}
            size="xs"
          />
          <span className="truncate">{memberDisplayName(deal.owner)}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {deal.pages.length > 0 && (
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {deal.pages.length}
            </span>
          )}
          {deal.expectedCloseDate && (
            <span
              className={cn(
                "flex items-center gap-1 tabular-nums",
                overdue && "font-medium text-destructive"
              )}
            >
              <CalendarDays className="h-3 w-3" />
              {formatCloseDate(deal.expectedCloseDate)}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
