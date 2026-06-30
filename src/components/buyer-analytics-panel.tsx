"use client";

import { useState, useEffect } from "react";
import {
  Users,
  TrendingUp,
  Target,
  Clock,
  RefreshCw,
  Flame,
  Sun,
  Snowflake,
  type LucideIcon,
} from "lucide-react";
import type { BuyerVisitorRow, BuyerAnalyticsSummary } from "@/types";
import { formatDuration } from "@/lib/format-utils";

interface BuyerAnalyticsPanelProps {
  pageId: string;
}

type Range = "7d" | "30d" | "all";

function IntentBadge({ intent }: { intent: BuyerVisitorRow["intent"] }) {
  const config: Record<
    string,
    { className: string; Icon: LucideIcon }
  > = {
    "High Intent": { className: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: Flame },
    "Warm":        { className: "bg-amber-50 text-amber-700 border-amber-200",       Icon: Sun },
    "Cold":        { className: "bg-slate-100 text-slate-500 border-slate-200",      Icon: Snowflake },
  };
  const { className, Icon } = config[intent] ?? config["Cold"];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${className}`}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      {intent}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const tier =
    score >= 70 ? { color: "#10b981", label: "High" } :
    score >= 40 ? { color: "#f59e0b", label: "Medium" } :
    { color: "#94a3b8", label: "Low" };
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-muted rounded-full overflow-hidden h-1.5" style={{ maxWidth: "72px" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, backgroundColor: tier.color }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums" style={{ color: tier.color }}>
        {score}
      </span>
      <span className="text-[10px] font-medium text-muted-foreground">{tier.label}</span>
    </div>
  );
}

// formatDuration imported from @/lib/format-utils

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
    hour:  "numeric",
    minute: "2-digit",
  });
}

export function BuyerAnalyticsPanel({ pageId }: BuyerAnalyticsPanelProps) {
  const [range, setRange] = useState<Range>("30d");
  const [summary, setSummary] = useState<BuyerAnalyticsSummary | null>(null);
  const [visitors, setVisitors] = useState<BuyerVisitorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(r: Range) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/buyer/analytics/${pageId}?range=${r}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSummary(data.summary);
      setVisitors(data.visitors);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(range); }, [range]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mt-6 rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Buyer Analytics</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Range selector */}
          <div className="flex items-center rounded-lg border border-border overflow-hidden text-xs font-medium">
            {(["7d", "30d", "all"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 transition-colors ${
                  range === r
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {r === "7d" ? "7 days" : r === "30d" ? "30 days" : "All time"}
              </button>
            ))}
          </div>
          <button
            onClick={() => load(range)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Summary stats */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border border-b border-border">
          {[
            { label: "Unique visitors", value: summary.totalVisitors, icon: Users },
            { label: "Return visitors", value: summary.uniqueReturning, icon: RefreshCw },
            { label: "High intent",     value: summary.highIntentCount, icon: Target },
            { label: "Avg. score",      value: summary.avgScore,        icon: TrendingUp },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="px-5 py-4 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                <span className="text-xs">{label}</span>
              </div>
              <span className="text-2xl font-bold tabular-nums text-foreground">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground animate-pulse">
          Loading buyer data…
        </div>
      ) : error ? (
        <div className="py-12 text-center text-sm text-destructive">{error}</div>
      ) : visitors.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No visitors yet for this period.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {[
                  "Visitor",
                  "Sessions",
                  "Last seen",
                  "Time spent",
                  "Score",
                  "Most viewed tab",
                  "CTA",
                  "Intent",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visitors.map((v) => (
                <tr key={v.visitorId} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-xs">
                    {v.contactName || v.contactEmail ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="h-5 w-5 rounded-full flex items-center justify-center text-white shrink-0"
                          style={{
                            backgroundColor: `hsl(${(v.contactEmail || "").length * 37 % 360}, 60%, 50%)`,
                            fontSize: "8px",
                            fontWeight: 700,
                          }}
                        >
                          {(v.contactName || v.contactEmail || "?")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {v.contactName || v.contactEmail}
                          </p>
                          {v.contactName && v.contactEmail && (
                            <p className="text-[10px] text-muted-foreground truncate">{v.contactEmail}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="font-mono text-muted-foreground">#{v.visitorHash}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold tabular-nums">{v.sessions}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(v.lastSeenAt)}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(v.totalDurationSeconds)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBar score={v.engagementScore} />
                  </td>
                  <td className="px-4 py-3 text-xs max-w-[140px] truncate" title={v.mostViewedTab}>
                    {v.mostViewedTab}
                  </td>
                  <td className="px-4 py-3 text-center text-base">
                    {v.ctaClicked ? "✅" : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <IntentBadge intent={v.intent} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
