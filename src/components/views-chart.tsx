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

  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-8">
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">
          Views — last 7 days
        </h3>
      </div>
      <div className="flex items-end gap-2 h-24">
        {days.map(({ label, count }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <div className="flex-1 flex flex-col items-center gap-1.5 cursor-default">
                <div
                  className="w-full rounded-t-sm bg-primary/80 transition-all hover:bg-primary"
                  style={{
                    height: `${Math.max(4, (count / maxDay) * 80)}px`,
                    minHeight: count > 0 ? "8px" : "3px",
                    opacity: count === 0 ? 0.25 : 1,
                  }}
                />
                <span className="text-[10px] text-muted-foreground">
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
    </div>
  );
}
