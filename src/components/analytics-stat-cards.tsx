"use client";

import { Activity, Eye, Clock, Link2, FileText, Users, Target, Share2, type LucideIcon } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const iconMap: Record<string, LucideIcon> = {
  Activity, Eye, Clock, Link2, FileText, Users, Target, Share2,
};

interface StatCard {
  label: string;
  value: string;
  icon: string;
  /** CSS color (e.g. "hsl(var(--chart-2))") used for the icon and its chip tint. */
  accent: string;
  description: string;
}

export function AnalyticsStatCards({ cards }: { cards: StatCard[] }) {
  // Static class lookup — Tailwind can't resolve interpolated class names.
  const lgCols =
    cards.length === 4 ? "lg:grid-cols-4" :
    cards.length === 5 ? "lg:grid-cols-5" :
    "lg:grid-cols-6";
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 ${lgCols} gap-4 mb-8`}>
      {cards.map(({ label, value, icon, accent, description }) => {
        const Icon = iconMap[icon] ?? Eye;
        return (
        <Tooltip key={label}>
          <TooltipTrigger asChild>
            <div
              tabIndex={0}
              className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 cursor-default shadow-elevation-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)` }}
              >
                <Icon
                  style={{ width: "1rem", height: "1rem", color: accent }}
                />
              </div>
              <div>
                <p className="font-display text-display text-foreground tabular-figures leading-none">
                  {value}
                </p>
                <p className="text-2xs text-muted-foreground mt-1.5 leading-tight">
                  {label}
                </p>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[200px] text-center">
            <p>{description}</p>
          </TooltipContent>
        </Tooltip>
        );
      })}
    </div>
  );
}
