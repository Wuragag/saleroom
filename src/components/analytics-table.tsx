"use client";

import Link from "next/link";
import { Eye, Clock, Link2, Globe, FileX, ChevronRight, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
      {pages.map((p) => {
        return (
          <div key={p.id} className="relative px-6 py-4 flex items-center gap-4 hover:bg-muted/40 transition-colors">
            <Link
              href={`/analytics/${p.id}`}
              aria-label={`Open analytics for ${p.title}`}
              className="absolute inset-0 z-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset rounded-none"
            >
              <span className="sr-only">Open analytics for {p.title}</span>
            </Link>

            {/* Title + status */}
            <div className="relative z-10 flex-1 min-w-0 pointer-events-none">
              <div className="flex items-center gap-2 min-w-0">
                {p.published ? (
                  <Globe className="h-3.5 w-3.5 text-success shrink-0" />
                ) : (
                  <FileX className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                <span className="text-sm font-medium text-foreground truncate">
                  {p.title}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 pl-5">
                Updated {timeAgo(p.updatedAt)}
              </p>
            </div>

            {/* Bar */}
            <div className="relative z-10 w-24 hidden sm:block pointer-events-none">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/70 rounded-full"
                  style={{ width: `${(p.views / maxViews) * 100}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="relative z-10 flex items-center gap-4 text-xs text-muted-foreground shrink-0 pointer-events-none">
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
                  <Badge variant="success" className="rounded-full px-1.5 py-0.5 text-3xs">
                    {p.highIntentCount} hot
                  </Badge>
                )}
              </span>
            </div>

            <ChevronRight className="relative z-10 h-4 w-4 text-muted-foreground shrink-0 pointer-events-none" />
          </div>
        );
      })}
    </div>
  );
}
