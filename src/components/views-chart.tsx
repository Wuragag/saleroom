"use client";

import { TrendingUp } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface ViewsChartProps {
  days: { label: string; count: number }[];
}

export function ViewsChart({ days }: ViewsChartProps) {
  const maxDay = Math.max(...days.map((d) => d.count), 1);
  const isEmpty = days.every((d) => d.count === 0);

  return (
    <div className="bg-card border border-border rounded-xl p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">
          Views — last 7 days
        </h3>
      </div>
      {isEmpty ? (
        <div className="flex flex-1 min-h-32 items-center justify-center text-sm text-muted-foreground">
          No views yet
        </div>
      ) : (
      <div className="flex items-stretch gap-2 flex-1 min-h-36">
        {days.map(({ label, count }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <div
                className="flex-1 flex flex-col cursor-default"
                aria-label={`${count} ${count === 1 ? "view" : "views"} on ${label}`}
              >
                <div className="flex-1 flex flex-col items-stretch justify-end gap-1">
                  {count > 0 ? (
                    <>
                      <span className="text-2xs font-medium text-muted-foreground text-center tabular-nums">
                        {count}
                      </span>
                      <div
                        className="w-full rounded-t-sm bg-primary/80 transition-all hover:bg-primary"
                        style={{
                          height: `${Math.max(4, (count / maxDay) * 88)}%`,
                        }}
                      />
                    </>
                  ) : (
                    // Empty day: a faint baseline stub so the day still registers
                    <div className="w-full h-1 rounded-full bg-muted" />
                  )}
                </div>
                <span className="mt-1.5 text-2xs text-muted-foreground text-center">
                  {label}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>
                {count} {count === 1 ? "view" : "views"}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      )}
    </div>
  );
}
