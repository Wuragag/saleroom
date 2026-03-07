"use client";

import {
  UserPlus,
  UserCheck,
  Eye,
  MousePointer,
  FileText,
  Download,
  Share2,
  CheckSquare,
} from "lucide-react";
import type { TimelineEvent } from "@/types";
import { TIMELINE_EVENT_CONFIG, getVisitorColor } from "@/lib/timeline-utils";
import { formatRelativeTime, formatDuration } from "@/lib/format-utils";
import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  UserPlus,
  UserCheck,
  Eye,
  MousePointer,
  FileText,
  Download,
  Share2,
  CheckSquare,
};

function getDescription(event: TimelineEvent): string {
  const cfg = TIMELINE_EVENT_CONFIG[event.type];
  switch (event.type) {
    case "first_visit":
      return "First visit";
    case "return_visit":
      return event.detail.totalSessions
        ? `Return visit (session #${event.detail.totalSessions})`
        : "Return visit";
    case "tab_viewed":
      return event.detail.tabName
        ? `Viewed "${event.detail.tabName}" for ${formatDuration(event.detail.duration as number)}`
        : "Viewed a tab";
    case "cta_clicked":
      return event.detail.label
        ? `Clicked CTA: ${event.detail.label}`
        : "Clicked CTA";
    case "form_submitted":
      return event.detail.email
        ? `Submitted form (${event.detail.email})`
        : "Submitted a form";
    case "file_downloaded":
      return event.detail.fileName
        ? `Downloaded "${event.detail.fileName}"`
        : "Downloaded a file";
    case "link_shared":
      return "Page link was shared";
    case "map_item_completed":
      return event.detail.title
        ? `Completed MAP item: "${event.detail.title}"`
        : "Completed a MAP item";
    default:
      return cfg.label;
  }
}

interface TimelineEventRowProps {
  event: TimelineEvent;
  showVisitorDot?: boolean;
}

export function TimelineEventRow({ event, showVisitorDot = true }: TimelineEventRowProps) {
  const cfg = TIMELINE_EVENT_CONFIG[event.type];
  const Icon = ICON_MAP[cfg.icon] ?? Eye;
  const visitorColor = event.visitorHash ? getVisitorColor(event.visitorHash) : undefined;

  return (
    <div
      className={`flex items-start gap-3 px-4 py-2.5 ${
        event.isSeller ? "opacity-60" : ""
      }`}
    >
      {/* Visitor color dot */}
      <div className="flex-shrink-0 mt-1 w-5 flex justify-center">
        {showVisitorDot && visitorColor ? (
          <span
            className="block w-2 h-2 rounded-full"
            style={{ backgroundColor: visitorColor }}
          />
        ) : (
          <span className="block w-2 h-2" />
        )}
      </div>

      {/* Icon */}
      <div className={`flex-shrink-0 mt-0.5 ${cfg.colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Description */}
      <p className="flex-1 text-sm text-foreground leading-snug min-w-0">
        {getDescription(event)}
      </p>

      {/* Timestamp */}
      <span className="flex-shrink-0 text-xs text-muted-foreground whitespace-nowrap">
        {formatRelativeTime(event.timestamp)}
      </span>
    </div>
  );
}
