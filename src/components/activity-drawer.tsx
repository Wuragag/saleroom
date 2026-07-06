"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/icon-button";
import { formatRelativeTime } from "@/lib/format-utils";
import {
  activityActor,
  activityPredicate,
  activityDotClass,
} from "@/lib/activity-feed";
import { useActivityFeed } from "@/hooks/use-activity-feed";
import type { ActivityFeedItem } from "@/types";

const OPEN_KEY = "dashboard-activity";
const SEEN_KEY = "dashboard-activity-seen";

function ActivityRow({ item }: { item: ActivityFeedItem }) {
  return (
    <Link
      href={`/analytics/${item.page.id}`}
      className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-muted/60"
    >
      <span
        className={cn(
          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
          activityDotClass(item.type)
        )}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="block text-small leading-snug text-muted-foreground">
          <span className="font-medium text-foreground">
            {activityActor(item)}
          </span>{" "}
          {activityPredicate(item)}
        </span>
        <span className="mt-0.5 block text-2xs text-tertiary">
          {formatRelativeTime(item.timestamp)}
        </span>
      </span>
    </Link>
  );
}

function ActivityList({
  items,
  loading,
  error,
}: {
  items: ActivityFeedItem[];
  loading: boolean;
  error: boolean;
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-4 px-5 py-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-muted" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-3 w-4/5 rounded bg-muted" />
              <div className="h-2.5 w-16 rounded bg-muted opacity-60" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <p className="px-5 py-8 text-center text-2xs text-tertiary">
        Couldn’t load activity right now.
      </p>
    );
  }
  if (items.length === 0) {
    // Quiet, in-flow empty state — no CTA (per the design's empty-state rule).
    return (
      <p className="px-5 py-8 text-center text-2xs leading-relaxed text-tertiary">
        Quiet for now. Buyer activity shows up here as soon as someone opens one
        of your pages.
      </p>
    );
  }
  return (
    <div className="flex flex-col">
      {items.map((item) => (
        <ActivityRow key={item.id} item={item} />
      ))}
    </div>
  );
}

/** The expanded panel: serif heading, View all, optional collapse, and list. */
function ActivityPanel({
  items,
  loading,
  error,
  onCollapse,
  className,
}: {
  items: ActivityFeedItem[];
  loading: boolean;
  error: boolean;
  onCollapse?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex w-full flex-col overflow-hidden", className)}>
      <div className="flex items-center justify-between gap-2 px-5 py-4">
        <h2 className="font-display text-heading text-foreground">
          Recent activity
        </h2>
        <div className="flex items-center gap-1">
          <Link
            href="/analytics"
            className="rounded-full border border-transparent px-3 py-1.5 text-2xs font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground"
          >
            View all
          </Link>
          {onCollapse && (
            <IconButton
              aria-label="Collapse activity panel"
              size="sm"
              onClick={onCollapse}
            >
              <ChevronRight className="h-4 w-4" />
            </IconButton>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto border-t border-border py-2">
        <ActivityList items={items} loading={loading} error={error} />
      </div>
    </div>
  );
}

/**
 * Dashboard Recent Activity drawer. Rendered as the AppShell `aside`, so it
 * spans the full height of the main surface, flush to its right edge (a right
 * column on lg+, a stacked block below the content on smaller screens). The
 * lg column collapses to a 52px rail.
 */
export function ActivityDrawer() {
  const { items, loading, error } = useActivityFeed();
  const [collapsed, setCollapsed] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  // Gate the seen-marking effect until the persisted collapsed state is
  // restored — otherwise a returning collapsed user has `collapsed=false`
  // during the first render and their newest item is auto-marked seen, so the
  // unseen dot never appears.
  const [restored, setRestored] = useState(false);

  // Restore persisted state after mount (avoids SSR mismatch).
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(OPEN_KEY) === "collapsed");
      setLastSeen(localStorage.getItem(SEEN_KEY));
    } catch {
      /* ignore */
    }
    setRestored(true);
  }, []);

  const newest = items[0]?.timestamp ?? null;
  const hasUnseen = !!newest && (!lastSeen || newest > lastSeen);

  // Once restored, an expanded+visible panel marks the newest item as seen.
  useEffect(() => {
    if (!restored || collapsed || !newest || newest === lastSeen) return;
    setLastSeen(newest);
    try {
      localStorage.setItem(SEEN_KEY, newest);
    } catch {
      /* ignore */
    }
  }, [restored, collapsed, newest, lastSeen]);

  const setOpen = (open: boolean) => {
    setCollapsed(!open);
    try {
      localStorage.setItem(OPEN_KEY, open ? "open" : "collapsed");
    } catch {
      /* ignore */
    }
  };

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col self-stretch border-t border-border lg:border-l lg:border-t-0",
        collapsed ? "w-full lg:w-[52px]" : "w-full lg:w-[300px]"
      )}
    >
      {collapsed ? (
        <>
          {/* lg: collapsed rail */}
          <button
            onClick={() => setOpen(true)}
            aria-label="Open recent activity panel"
            className="hidden w-full flex-1 flex-col items-center gap-4 py-6 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground lg:flex"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border">
              <ChevronLeft className="h-4 w-4" />
            </span>
            <span className="text-small font-semibold tracking-wide [writing-mode:vertical-rl] [transform:rotate(180deg)]">
              Recent activity
            </span>
            {hasUnseen && (
              <span className="h-1.5 w-1.5 rounded-full bg-info animate-pulse-info" />
            )}
          </button>
          {/* below lg: still show the full stacked panel */}
          <ActivityPanel
            items={items}
            loading={loading}
            error={error}
            className="lg:hidden"
          />
        </>
      ) : (
        <ActivityPanel
          items={items}
          loading={loading}
          error={error}
          onCollapse={() => setOpen(false)}
        />
      )}
    </aside>
  );
}
