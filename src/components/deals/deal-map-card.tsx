"use client";

import Link from "next/link";
import { CalendarDays, CheckCircle2, Circle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/utils";
import { formatCloseDate } from "@/components/deals/deal-card";
import type { DealMapSummary } from "@/types";

/**
 * Read-only mutual-action-plan summaries from linked rooms. Editing lives in
 * the room editor — this is the deal-level "where does the close plan stand".
 */
export function DealMapCard({ actionPlans }: { actionPlans: DealMapSummary[] }) {
  if (actionPlans.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <SectionLabel>Action plan</SectionLabel>
      </div>
      <div className="divide-y divide-border">
        {actionPlans.map((plan) => (
          <div key={plan.pageId} className="px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {plan.title}
                </p>
                <p className="truncate text-2xs text-muted-foreground">
                  In{" "}
                  <Link
                    href={`/editor/${plan.pageId}`}
                    className="hover:text-foreground hover:underline"
                  >
                    {plan.pageTitle}
                  </Link>
                </p>
              </div>
              {plan.closeDate && (
                <span className="flex items-center gap-1 text-2xs tabular-nums text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  Target {formatCloseDate(plan.closeDate)}
                </span>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2.5">
              <Progress
                value={plan.completedCount}
                max={Math.max(plan.totalCount, 1)}
                className="h-1.5 flex-1"
                animated={false}
              />
              <span className="text-2xs tabular-nums text-muted-foreground">
                {plan.completedCount}/{plan.totalCount}
              </span>
            </div>

            {plan.items.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {plan.items.map((item) => {
                  const overdue =
                    !item.completed &&
                    item.dueDate &&
                    new Date(item.dueDate).getTime() < Date.now();
                  return (
                    <li key={item.id} className="flex items-center gap-2 text-xs">
                      {item.completed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                      )}
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate",
                          item.completed
                            ? "text-muted-foreground line-through"
                            : "text-foreground"
                        )}
                      >
                        {item.title}
                      </span>
                      <Badge variant={item.ownerType === "buyer" ? "info" : "neutral"}>
                        {item.ownerType === "buyer" ? "Buyer" : "Seller"}
                      </Badge>
                      {item.dueDate && (
                        <span
                          className={cn(
                            "shrink-0 tabular-nums text-2xs",
                            overdue
                              ? "font-medium text-destructive"
                              : "text-muted-foreground"
                          )}
                        >
                          {formatCloseDate(item.dueDate)}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
