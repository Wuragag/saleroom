"use client";

import { RefreshCw, Activity, Filter } from "lucide-react";
import { useActivityTimeline } from "@/hooks/use-activity-timeline";
import { TimelineEventRow } from "@/components/activity-timeline-event";
import { getVisitorColor, getVisitorLabel, TIMELINE_EVENT_CONFIG } from "@/lib/timeline-utils";
import type { TimelineEventType } from "@/types";

type Range = "7d" | "30d" | "all";

function formatDateHeading(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const eventDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (eventDay.getTime() === today.getTime()) return "Today";
  if (eventDay.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface ActivityTimelineProps {
  pageId: string;
}

export function ActivityTimeline({ pageId }: ActivityTimelineProps) {
  const {
    sessionGroups,
    visitors,
    loading,
    hasMore,
    loadMore,
    range,
    visitorId,
    types,
    setRange,
    setVisitorFilter,
    setTypeFilter,
    refresh,
  } = useActivityTimeline(pageId);

  // Group session groups by date
  const dateGroups: { date: string; label: string; groups: typeof sessionGroups }[] = [];
  for (const group of sessionGroups) {
    const firstTs = group.events[0].timestamp;
    const dateKey = new Date(firstTs).toISOString().slice(0, 10);
    const existing = dateGroups.find((dg) => dg.date === dateKey);
    if (existing) {
      existing.groups.push(group);
    } else {
      dateGroups.push({
        date: dateKey,
        label: formatDateHeading(firstTs),
        groups: [group],
      });
    }
  }

  const eventTypeOptions: { value: TimelineEventType; label: string }[] = Object.entries(
    TIMELINE_EVENT_CONFIG
  ).map(([value, cfg]) => ({
    value: value as TimelineEventType,
    label: cfg.label,
  }));

  const toggleType = (type: TimelineEventType) => {
    setTypeFilter(
      types.includes(type) ? types.filter((t) => t !== type) : [...types, type]
    );
  };

  const hasEvents = sessionGroups.length > 0;
  const isFiltered = visitorId || types.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* ── Header ── */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Activity Timeline</span>
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
            onClick={refresh}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="px-5 py-3 border-b border-border flex items-center gap-3 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />

        {/* Visitor dropdown */}
        <select
          value={visitorId ?? ""}
          onChange={(e) => setVisitorFilter(e.target.value || null)}
          className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All visitors</option>
          {visitors.map((v) => (
            <option key={v.id} value={v.id}>
              {getVisitorLabel(v.hash, v.email)}
            </option>
          ))}
        </select>

        {/* Event type pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {eventTypeOptions.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => toggleType(value)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                types.includes(value)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "text-muted-foreground border-border hover:border-foreground/20 hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
          {isFiltered && (
            <button
              onClick={() => {
                setVisitorFilter(null);
                setTypeFilter([]);
              }}
              className="px-2 py-1 rounded-full text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {loading && !hasEvents ? (
        <div className="py-16 text-center text-sm text-muted-foreground animate-pulse">
          Loading activity…
        </div>
      ) : !hasEvents ? (
        <div className="py-16 text-center">
          <Activity className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No activity yet</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Share your page to start tracking visitor engagement. Events will appear here
            as buyers interact with your content.
          </p>
        </div>
      ) : (
        <div>
          {dateGroups.map((dg) => (
            <div key={dg.date}>
              {/* Date heading */}
              <div className="px-5 py-2 bg-muted/30 border-b border-border">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {dg.label}
                </span>
              </div>

              {/* Session groups */}
              {dg.groups.map((group, gi) => (
                <div
                  key={`${dg.date}-${gi}`}
                  className="border-b border-border last:border-b-0"
                >
                  {/* Session header for grouped visitor events */}
                  {group.visitorHash && group.events.length > 1 && (
                    <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getVisitorColor(group.visitorHash) }}
                      />
                      <span className="text-xs font-semibold text-foreground">
                        {getVisitorLabel(group.visitorHash, group.visitorEmail)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        · {group.events.length} events
                      </span>
                    </div>
                  )}

                  {/* Events */}
                  {group.events.map((ev) => (
                    <TimelineEventRow
                      key={ev.id}
                      event={ev}
                      showVisitorDot={!group.visitorHash || group.events.length === 1}
                    />
                  ))}
                </div>
              ))}
            </div>
          ))}

          {/* Load more */}
          {hasMore && (
            <div className="px-5 py-4 text-center border-t border-border">
              <button
                onClick={loadMore}
                disabled={loading}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
              >
                {loading ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
