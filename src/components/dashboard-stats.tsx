import { Eye, Clock, Radio } from "lucide-react";

import { formatDuration } from "@/lib/format-utils";

interface DashboardStatsProps {
  totalViews: number;
  avgDuration: number;
  livePages: number;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  live,
}: {
  label: string;
  value: string;
  sub: string;
  icon: typeof Eye;
  live?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-elevation-1">
      <div className="flex items-center justify-between">
        <p className="text-caption font-semibold uppercase text-muted-foreground">
          {label}
        </p>
        <span className="relative flex h-6 w-6 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {live && (
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-info animate-pulse-info" />
          )}
        </span>
      </div>
      <p className="mt-3 font-display text-stat tabular-figures text-foreground">
        {value}
      </p>
      <p className="mt-2 text-2xs text-tertiary">{sub}</p>
    </div>
  );
}

/**
 * Aggregate workspace stats shown under the dashboard masthead. Numbers are
 * real (summed from page analytics) — no synthetic trend lines.
 */
export function DashboardStats({
  totalViews,
  avgDuration,
  livePages,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        label="Total views"
        value={totalViews.toLocaleString()}
        sub="Across all pages"
        icon={Eye}
      />
      <StatCard
        label="Avg. time on page"
        value={avgDuration > 0 ? formatDuration(avgDuration) : "—"}
        sub="How long buyers stay"
        icon={Clock}
      />
      <StatCard
        label="Live pages"
        value={livePages.toLocaleString()}
        sub={livePages > 0 ? "Published and shareable" : "Nothing live yet"}
        icon={Radio}
        live={livePages > 0}
      />
    </div>
  );
}
