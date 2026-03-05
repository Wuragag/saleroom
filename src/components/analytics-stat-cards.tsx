"use client";

import { Eye, Clock, Link2, FileText, Users, Target, type LucideIcon } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const iconMap: Record<string, LucideIcon> = {
  Eye, Clock, Link2, FileText, Users, Target,
};

interface StatCard {
  label: string;
  value: string;
  icon: string;
  color: string;
  bg: string;
  description: string;
}

export function AnalyticsStatCards({ cards }: { cards: StatCard[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {cards.map(({ label, value, icon, color, bg, description }) => {
        const Icon = iconMap[icon] ?? Eye;
        return (
        <Tooltip key={label}>
          <TooltipTrigger asChild>
            <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 cursor-default">
              <div
                className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}
              >
                <Icon
                  className={color}
                  style={{ width: "1rem", height: "1rem" }}
                />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground tracking-tight">
                  {value}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
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
