"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDealValue, formatStageAge, isOverdue } from "@/lib/deals";
import { DealPulse, formatCloseDate } from "@/components/deals/deal-card";
import { memberDisplayName } from "@/components/deals/member-picker";
import type { DealListItem, PipelineStageData } from "@/types";

const GRID =
  "grid grid-cols-[minmax(0,1.8fr)_130px_90px_104px_84px_150px_170px] items-center gap-3";

interface DealListProps {
  deals: DealListItem[];
  stages: PipelineStageData[];
  onStageChange: (dealId: string, stageId: string) => void;
}

function StageCell({
  deal,
  stages,
  onStageChange,
}: {
  deal: DealListItem;
  stages: PipelineStageData[];
  onStageChange: (dealId: string, stageId: string) => void;
}) {
  if (deal.status === "WON") return <Badge variant="success">Won</Badge>;
  if (deal.status === "LOST") return <Badge variant="neutral">Lost</Badge>;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-2xs font-semibold text-foreground transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {deal.stage.name}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
        {stages.map((s) => (
          <DropdownMenuItem key={s.id} onClick={() => onStageChange(deal.id, s.id)}>
            <span className="w-4">
              {s.id === deal.stage.id && <Check className="h-3.5 w-3.5" />}
            </span>
            {s.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DealList({ deals, stages, onStageChange }: DealListProps) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <div className="min-w-[900px]">
        <div
          className={cn(
            GRID,
            "border-b border-border bg-muted/30 px-4 py-2 text-2xs font-semibold uppercase tracking-wide text-muted-foreground"
          )}
        >
          <span>Deal</span>
          <span>Stage</span>
          <span>Value</span>
          <span>Close date</span>
          <span>In stage</span>
          <span>Owner</span>
          <span>Buyer activity</span>
        </div>
        <div className="divide-y divide-border">
          {deals.map((deal) => (
            <div
              key={deal.id}
              onClick={() => router.push(`/deals/${deal.id}`)}
              className={cn(GRID, "cursor-pointer px-4 py-3 transition-colors hover:bg-muted/40")}
            >
              <span className="min-w-0">
                <Link
                  href={`/deals/${deal.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="block truncate text-sm font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  {deal.name}
                </Link>
                {deal.company && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {deal.company.name}
                  </span>
                )}
              </span>
              <span>
                <StageCell deal={deal} stages={stages} onStageChange={onStageChange} />
              </span>
              <span className="text-sm tabular-nums text-foreground">
                {formatDealValue(deal.value)}
              </span>
              <span
                className={cn(
                  "text-xs tabular-nums text-muted-foreground",
                  isOverdue(deal) && "font-medium text-destructive"
                )}
              >
                {deal.expectedCloseDate
                  ? formatCloseDate(deal.expectedCloseDate)
                  : "—"}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {deal.status === "OPEN" ? formatStageAge(deal.stageEnteredAt) : "—"}
              </span>
              <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                <Avatar
                  name={memberDisplayName(deal.owner)}
                  src={deal.owner.avatarUrl || null}
                  size="xs"
                />
                <span className="truncate">{memberDisplayName(deal.owner)}</span>
              </span>
              <span>
                <DealPulse deal={deal} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
