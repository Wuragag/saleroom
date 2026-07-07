"use client";

import { Fragment, useState, useEffect } from "react";
import {
  Users,
  Clock,
  RefreshCw,
  Flame,
  Sun,
  Snowflake,
  Check,
  Minus,
  ChevronRight,
  Layers,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { BuyerVisitorRow, SectionEngagement, BuyerSessionSummary } from "@/types";
import { formatDuration } from "@/lib/format-utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SessionReplayPlayer } from "@/components/session-replay-player";
import { SESSION_REPLAY_ENABLED } from "@/lib/feature-flags";

interface BuyerAnalyticsPanelProps {
  pageId: string;
}

type Range = "7d" | "30d" | "all";

function IntentBadge({ intent }: { intent: BuyerVisitorRow["intent"] }) {
  const config: Record<
    string,
    { variant: "success" | "warning" | "neutral"; Icon: LucideIcon }
  > = {
    "High Intent": { variant: "success", Icon: Flame },
    "Warm":        { variant: "warning", Icon: Sun },
    "Cold":        { variant: "neutral", Icon: Snowflake },
  };
  const { variant, Icon } = config[intent] ?? config["Cold"];
  return (
    <Badge variant={variant} className="gap-1 rounded-full">
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      {intent}
    </Badge>
  );
}

function ScoreBar({ score }: { score: number }) {
  // Tier color comes from a token var (not a hex); the bar width/fill is
  // data-driven so the color stays an inline style. The tier is conveyed by
  // color + the Intent column — no separate text label needed.
  const tier =
    score >= 70 ? { color: "hsl(var(--success))", label: "high" } :
    score >= 40 ? { color: "hsl(var(--warning))", label: "medium" } :
    { color: "hsl(var(--muted-foreground))", label: "low" };
  return (
    <div className="flex items-center gap-2" title={`Engagement score ${score} of 100 (${tier.label})`}>
      <div className="flex-1 bg-muted rounded-full overflow-hidden h-1.5" style={{ maxWidth: "72px" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, backgroundColor: tier.color }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums" style={{ color: tier.color }}>
        {score}
      </span>
    </div>
  );
}

// formatDuration imported from @/lib/format-utils

/** Per-section engagement breakdown shown when a visitor row is expanded. */
function SectionBreakdown({ sections }: { sections: SectionEngagement[] }) {
  if (!sections || sections.length === 0) {
    return (
      <p className="text-xs text-muted-foreground px-1 py-2">
        No section activity recorded for this visitor yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-0.5">
        <Layers className="h-3.5 w-3.5" />
        Section engagement
      </div>
      {sections.map((s) => (
        <div key={s.tabId} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate text-xs font-medium text-foreground" title={s.tabName}>
            {s.tabName}
          </span>
          {/* Dwell share bar */}
          <div className="flex-1 min-w-[80px] bg-muted rounded-full overflow-hidden h-2">
            <div
              className="h-full rounded-full bg-primary/80 transition-all"
              style={{ width: `${Math.max(2, s.sharePct)}%` }}
            />
          </div>
          <span className="w-16 shrink-0 text-right text-xs font-mono text-muted-foreground tabular-nums">
            {formatDuration(s.durationSeconds)}
          </span>
          <span
            className="w-14 shrink-0 text-right text-3xs text-muted-foreground tabular-nums"
            title={`${s.viewCount} view${s.viewCount === 1 ? "" : "s"}`}
          >
            {s.viewCount}×
          </span>
          <span
            className="w-20 shrink-0 text-right text-3xs tabular-nums"
            title="Deepest scroll reached in this section"
          >
            {s.maxScrollPct > 0 ? (
              <span className="text-muted-foreground">{s.maxScrollPct}% read</span>
            ) : (
              <span className="text-muted-foreground/50">—</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

/** List of a visitor's sessions with a "Watch replay" affordance where a recording exists. */
function SessionsList({
  sessions,
  onWatch,
}: {
  sessions: BuyerSessionSummary[];
  onWatch: (sessionId: string) => void;
}) {
  if (!sessions || sessions.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 mt-4 pt-4 border-t border-border">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-0.5">
        <Video className="h-3.5 w-3.5" />
        Sessions
      </div>
      {sessions.map((s) => (
        <div key={s.sessionId} className="flex items-center gap-3 text-xs">
          <span className="w-36 shrink-0 text-muted-foreground">{formatDate(s.startedAt)}</span>
          <span className="w-16 shrink-0 font-mono text-muted-foreground tabular-nums">
            {formatDuration(s.durationSeconds)}
          </span>
          {s.hasRecording ? (
            <button
              onClick={() => onWatch(s.sessionId)}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              <Video className="h-3 w-3" />
              Watch replay
            </button>
          ) : (
            <span className="text-3xs text-muted-foreground/50">No replay</span>
          )}
        </div>
      ))}
    </div>
  );
}

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
  const [visitors, setVisitors] = useState<BuyerVisitorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replaySessionId, setReplaySessionId] = useState<string | null>(null);

  async function load(r: Range) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/buyer/analytics/${pageId}?range=${r}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
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
                aria-pressed={range === r}
                className={`px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
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
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Refresh"
            aria-label="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground animate-pulse">
          Loading buyer data…
        </div>
      ) : error ? (
        <div className="py-12 text-center text-sm text-destructive">
          Couldn&apos;t load buyer data.
        </div>
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
                    scope="col"
                    className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visitors.map((v) => {
                const isExpanded = expandedId === v.visitorId;
                return (
                <Fragment key={v.visitorId}>
                <tr
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : v.visitorId)}
                  aria-expanded={isExpanded}
                >
                  <td className="px-4 py-3 text-xs">
                    <div className="flex items-center gap-2">
                      <ChevronRight
                        className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                        aria-hidden="true"
                      />
                      {v.contactName || v.contactEmail ? (
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar
                            name={v.contactName || v.contactEmail || v.visitorHash || "?"}
                            size="xs"
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {v.contactName || v.contactEmail}
                            </p>
                            {v.contactName && v.contactEmail && (
                              <p className="text-3xs text-muted-foreground truncate">{v.contactEmail}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="font-mono text-muted-foreground">#{v.visitorHash}</span>
                      )}
                    </div>
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
                  <td className="px-4 py-3 text-center">
                    {v.ctaClicked ? (
                      <Check
                        className="h-4 w-4 text-success mx-auto"
                        aria-label="CTA clicked"
                      />
                    ) : (
                      <Minus
                        className="h-4 w-4 text-muted-foreground mx-auto"
                        aria-label="No CTA click"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <IntentBadge intent={v.intent} />
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="bg-muted/20">
                    <td colSpan={8} className="px-6 py-4">
                      <SectionBreakdown sections={v.sections} />
                      {SESSION_REPLAY_ENABLED && (
                        <SessionsList sessions={v.sessionsList} onWatch={setReplaySessionId} />
                      )}
                    </td>
                  </tr>
                )}
                </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!replaySessionId} onOpenChange={(open) => !open && setReplaySessionId(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Session replay
            </DialogTitle>
          </DialogHeader>
          {replaySessionId && <SessionReplayPlayer sessionId={replaySessionId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
