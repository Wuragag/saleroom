"use client";

import { useState, useCallback, useEffect } from "react";
import type { TimelineEvent, TimelineEventType, TimelineVisitor } from "@/types";

type Range = "7d" | "30d" | "all";

interface SessionGroup {
  visitorId: string | null;
  visitorHash: string | null;
  visitorEmail: string | null;
  events: TimelineEvent[];
}

interface UseActivityTimelineReturn {
  events: TimelineEvent[];
  visitors: TimelineVisitor[];
  sessionGroups: SessionGroup[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  range: Range;
  visitorId: string | null;
  types: TimelineEventType[];
  setRange: (r: Range) => void;
  setVisitorFilter: (id: string | null) => void;
  setTypeFilter: (types: TimelineEventType[]) => void;
  refresh: () => void;
}

/** Group events into session blocks: consecutive events from same visitor within 5 min. */
function groupIntoSessions(events: TimelineEvent[]): SessionGroup[] {
  const groups: SessionGroup[] = [];
  let current: SessionGroup | null = null;

  for (const ev of events) {
    const fitsCurrentGroup =
      current &&
      current.visitorId &&
      current.visitorId === ev.visitorId &&
      Math.abs(
        new Date(current.events[current.events.length - 1].timestamp).getTime() -
          new Date(ev.timestamp).getTime()
      ) < 300_000; // 5 minutes

    if (fitsCurrentGroup) {
      current!.events.push(ev);
    } else {
      current = {
        visitorId: ev.visitorId,
        visitorHash: ev.visitorHash,
        visitorEmail: ev.visitorEmail,
        events: [ev],
      };
      groups.push(current);
    }
  }

  return groups;
}

export function useActivityTimeline(pageId: string): UseActivityTimelineReturn {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [visitors, setVisitors] = useState<TimelineVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);

  const [range, setRangeState] = useState<Range>("30d");
  const [visitorId, setVisitorIdState] = useState<string | null>(null);
  const [types, setTypesState] = useState<TimelineEventType[]>([]);

  const fetchEvents = useCallback(
    async (opts: { reset?: boolean } = {}) => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ range, limit: "50" });
        if (!opts.reset && cursor) qs.set("cursor", cursor);
        if (visitorId) qs.set("visitorId", visitorId);
        if (types.length > 0) qs.set("types", types.join(","));

        const res = await fetch(`/api/buyer/timeline/${pageId}?${qs}`);
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();

        if (opts.reset) {
          setEvents(data.events);
        } else {
          setEvents((prev) => [...prev, ...data.events]);
        }
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
        if (data.visitors?.length > 0) setVisitors(data.visitors);
      } catch {
        // silently fail — error state not needed for timeline
      } finally {
        setLoading(false);
      }
    },
    [pageId, range, visitorId, types, cursor]
  );

  // Initial load + reload when filters change
  useEffect(() => {
    setCursor(null);
    setEvents([]);
    // fetchEvents with reset needs to be called after state is cleared
    const load = async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ range, limit: "50" });
        if (visitorId) qs.set("visitorId", visitorId);
        if (types.length > 0) qs.set("types", types.join(","));

        const res = await fetch(`/api/buyer/timeline/${pageId}?${qs}`);
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();

        setEvents(data.events);
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
        if (data.visitors?.length > 0) setVisitors(data.visitors);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [pageId, range, visitorId, types]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => {
    if (hasMore && !loading) fetchEvents();
  }, [hasMore, loading, fetchEvents]);

  const refresh = useCallback(() => {
    setCursor(null);
    setEvents([]);
    fetchEvents({ reset: true });
  }, [fetchEvents]);

  const sessionGroups = groupIntoSessions(events);

  return {
    events,
    visitors,
    sessionGroups,
    loading,
    hasMore,
    loadMore,
    range,
    visitorId,
    types,
    setRange: setRangeState,
    setVisitorFilter: setVisitorIdState,
    setTypeFilter: setTypesState,
    refresh,
  };
}
