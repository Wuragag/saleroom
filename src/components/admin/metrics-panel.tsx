"use client";

import { useState, useEffect } from "react";
import { Loader2, Users, Building2, FileText, TrendingUp } from "lucide-react";

interface Metrics {
  totalUsers: number;
  totalTeams: number;
  totalPages: number;
  newUsersLast30Days: number;
  newTeamsLast30Days: number;
  planDistribution: {
    FREE: number;
    PRO: number;
    TEAM: number;
  };
}

const PLAN_BAR_COLORS: Record<string, string> = {
  FREE: "bg-muted-foreground/40",
  PRO: "bg-blue-500",
  TEAM: "bg-green-500",
};

const PLAN_LABEL_COLORS: Record<string, string> = {
  FREE: "text-muted-foreground",
  PRO: "text-blue-600 dark:text-blue-400",
  TEAM: "text-green-600 dark:text-green-400",
};

export function MetricsPanel() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/metrics")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load metrics");
        return r.json();
      })
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        Failed to load metrics
      </div>
    );
  }

  const totalTeamsForPercent = Math.max(1, metrics.totalTeams);
  const planEntries = [
    { key: "FREE", label: "Free", count: metrics.planDistribution.FREE },
    { key: "PRO", label: "Pro", count: metrics.planDistribution.PRO },
    { key: "TEAM", label: "Team", count: metrics.planDistribution.TEAM },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={metrics.totalUsers}
          sub={`+${metrics.newUsersLast30Days} last 30 days`}
        />
        <StatCard
          icon={Building2}
          label="Total Teams"
          value={metrics.totalTeams}
          sub={`+${metrics.newTeamsLast30Days} last 30 days`}
        />
        <StatCard
          icon={FileText}
          label="Total Pages"
          value={metrics.totalPages}
        />
        <StatCard
          icon={TrendingUp}
          label="Paid Teams"
          value={metrics.planDistribution.PRO + metrics.planDistribution.TEAM}
          sub={`${(
            ((metrics.planDistribution.PRO + metrics.planDistribution.TEAM) /
              totalTeamsForPercent) *
            100
          ).toFixed(0)}% of all teams`}
        />
      </div>

      {/* Plan distribution */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Plan Distribution</h3>
        <div className="space-y-3">
          {planEntries.map(({ key, label, count }) => {
            const pct = Math.round((count / totalTeamsForPercent) * 100);
            return (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-semibold uppercase tracking-wide ${PLAN_LABEL_COLORS[key]}`}>
                    {label}
                  </span>
                  <span className="text-muted-foreground">
                    {count} team{count !== 1 ? "s" : ""} · {pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${PLAN_BAR_COLORS[key]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
