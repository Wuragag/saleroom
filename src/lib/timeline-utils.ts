/**
 * Utilities for the Activity Timeline feature.
 */

import type { TimelineEventType } from "@/types";

// ── Visitor colours ──

const VISITOR_PALETTE = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
  "#ef4444", // red
  "#14b8a6", // teal
];

export function getVisitorColor(hash: string): string {
  let code = 0;
  for (let i = 0; i < hash.length; i++) code += hash.charCodeAt(i);
  return VISITOR_PALETTE[code % VISITOR_PALETTE.length];
}

export function getVisitorLabel(hash: string, email: string | null): string {
  return email || `Visitor #${hash}`;
}

// ── Email extraction from form data ──

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function extractEmailFromFormData(data: string): string | null {
  try {
    const parsed = JSON.parse(data);
    if (typeof parsed !== "object" || parsed === null) return null;
    for (const [key, val] of Object.entries(parsed)) {
      if (typeof val === "string") {
        if (/email/i.test(key) && EMAIL_REGEX.test(val)) return val;
      }
    }
    // Fallback: scan values for email pattern
    for (const val of Object.values(parsed)) {
      if (typeof val === "string" && EMAIL_REGEX.test(val)) return val;
    }
  } catch {
    // invalid JSON
  }
  return null;
}

// ── Event config ──

export interface TimelineEventConfig {
  icon: string;       // lucide-react icon name
  label: string;
  colorClass: string; // tailwind text-* class
}

export const TIMELINE_EVENT_CONFIG: Record<TimelineEventType, TimelineEventConfig> = {
  first_visit:          { icon: "UserPlus",      label: "First visit",         colorClass: "text-blue-500" },
  return_visit:         { icon: "UserCheck",     label: "Return visit",        colorClass: "text-indigo-500" },
  tab_viewed:           { icon: "Eye",           label: "Viewed tab",          colorClass: "text-slate-500" },
  cta_clicked:          { icon: "MousePointer",  label: "Clicked CTA",         colorClass: "text-emerald-500" },
  form_submitted:       { icon: "FileText",      label: "Submitted form",      colorClass: "text-violet-500" },
  file_downloaded:      { icon: "Download",      label: "Downloaded file",     colorClass: "text-amber-500" },
  link_shared:          { icon: "Share2",        label: "Link shared",         colorClass: "text-sky-500" },
  map_item_completed:   { icon: "CheckSquare",   label: "MAP item completed",  colorClass: "text-emerald-600" },
};
