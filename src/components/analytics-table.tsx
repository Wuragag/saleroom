"use client";

import { useState } from "react";
import { Eye, Clock, Link2, Globe, FileX, ChevronDown, ChevronUp, Users } from "lucide-react";
import { BuyerAnalyticsPanel } from "@/components/buyer-analytics-panel";
import { ActivityTimeline } from "@/components/activity-timeline";
import { formatDuration } from "@/lib/format-utils";

interface PageStat {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  updatedAt: string;
  views: number;
  avgDuration: number;
  linkClicks: number;
  uniqueBuyers: number;
  highIntentCount: number;
}

function timeAgo(dateStr: string | Date) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function AnalyticsTable({ pages, maxViews }: { pages: PageStat[]; maxViews: number }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <FileX className="h-8 w-8 opacity-40" />
        <p className="text-sm">No pages yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {pages.map((p) => (
        <div key={p.id}>
          <div
            className="px-6 py-4 flex items-center gap-4 hover:bg-muted/40 transition-colors cursor-pointer"
            onClick={() => setExpanded(expanded === p.id ? null : p.id)}
          >
            {/* Title + status */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                {p.published ? (
                  <Globe className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <FileX className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                <a
                  href={p.published ? `/p/${p.slug}` : `/editor/${p.id}`}
                  target={p.published ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-foreground truncate hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {p.title}
                </a>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 pl-5">
                Updated {timeAgo(p.updatedAt)}
              </p>
            </div>

            {/* Bar */}
            <div className="w-24 hidden sm:block">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/70 rounded-full"
                  style={{ width: `${(p.views / maxViews) * 100}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span className="font-medium text-foreground tabular-nums">{p.views}</span>
              </span>
              <span className="hidden md:flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(p.avgDuration)}
              </span>
              <span className="hidden md:flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                {p.linkClicks}
              </span>
              <span className="hidden sm:flex items-center gap-1.5">
                <Users className="h-3 w-3" />
                <span className="font-medium text-foreground tabular-nums">{p.uniqueBuyers}</span>
                {p.highIntentCount > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {p.highIntentCount} hot
                  </span>
                )}
              </span>
            </div>

            {/* Expand toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(expanded === p.id ? null : p.id);
              }}
              className="ml-2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
              title="Toggle buyer analytics"
            >
              {expanded === p.id ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Expandable buyer panel + activity timeline */}
          {expanded === p.id && (
            <div className="px-6 pb-6 bg-muted/20 space-y-4">
              <BuyerAnalyticsPanel pageId={p.id} />
              <ActivityTimeline pageId={p.id} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
