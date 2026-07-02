/**
 * Utilities for the Activity Timeline feature.
 */

import type { TimelineEventType } from "@/types";

// ── Visitor colours ──

// Number of categorical hues defined as --cat-1..N in globals.css. Visitor dots
// draw from the same tokenized palette the <Avatar> primitive uses, so a reskin
// of the categorical tokens reflows these colors too (no hardcoded hex here).
const CAT_COUNT = 6;

/**
 * Deterministic, tokenized visitor color. Returns an `hsl(var(--cat-N))` string
 * keyed by the same character-sum hash used before, so callers can keep using an
 * inline `backgroundColor` for a data-driven dot without hardcoding hues.
 */
export function getVisitorColor(hash: string): string {
  let code = 0;
  for (let i = 0; i < hash.length; i++) code += hash.charCodeAt(i);
  const idx = (code % CAT_COUNT) + 1;
  return `hsl(var(--cat-${idx}))`;
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

// colorClass maps each event accent to a status/token utility (per the design
// system's status-color mapping): blue/sky → info, emerald → success, amber →
// warning, slate → muted. Event types with no status meaning (return visit,
// form submit) use brand/info tokens so they stay tokenized and distinct.
export const TIMELINE_EVENT_CONFIG: Record<TimelineEventType, TimelineEventConfig> = {
  first_visit:          { icon: "UserPlus",      label: "First visit",         colorClass: "text-info" },
  return_visit:         { icon: "UserCheck",     label: "Return visit",        colorClass: "text-primary" },
  tab_viewed:           { icon: "Eye",           label: "Viewed tab",          colorClass: "text-muted-foreground" },
  cta_clicked:          { icon: "MousePointer",  label: "Clicked CTA",         colorClass: "text-success" },
  form_submitted:       { icon: "FileText",      label: "Submitted form",      colorClass: "text-info" },
  file_downloaded:      { icon: "Download",      label: "Downloaded file",     colorClass: "text-warning" },
  link_shared:          { icon: "Share2",        label: "Link shared",         colorClass: "text-info" },
  map_item_completed:   { icon: "CheckSquare",   label: "MAP item completed",  colorClass: "text-success" },
};
