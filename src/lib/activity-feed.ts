/**
 * Pure presentation helpers for the dashboard Recent Activity feed. Turns an
 * ActivityFeedItem into the "**who** what" sentence + the color-coded dot the
 * design calls for. Kept framework-free so it's unit-tested in isolation.
 */

import type { ActivityFeedItem, TimelineEventType } from "@/types";
import { formatDuration } from "@/lib/format-utils";

/**
 * Bolded subject of the row. Prefers a real contact (name, then email), falls
 * back to the short anonymous visitor hash, then a neutral noun.
 */
export function activityActor(item: ActivityFeedItem): string {
  if (item.actorName) return item.actorName;
  if (item.actorEmail) return item.actorEmail;
  if (item.actorHash) return `Visitor ${item.actorHash}`;
  return "Someone";
}

/**
 * The remainder of the sentence, naming the page. Read as
 * `${activityActor} ${activityPredicate}`.
 */
export function activityPredicate(item: ActivityFeedItem): string {
  const page = item.page.title;
  const dur =
    typeof item.detail.duration === "number" && item.detail.duration > 0
      ? ` for ${formatDuration(item.detail.duration)}`
      : "";

  switch (item.type) {
    case "first_visit":
      return `opened ${page}${dur}`;
    case "return_visit":
      return `came back to ${page}${dur}`;
    case "cta_clicked":
      return `clicked a call-to-action on ${page}`;
    case "file_downloaded":
      return `downloaded a file from ${page}`;
    case "form_submitted":
      return `submitted the form on ${page}`;
    case "map_item_completed":
      return `completed a next step on ${page}`;
    // Types not surfaced in the workspace feed, kept exhaustive for safety.
    case "tab_viewed":
      return `viewed a section of ${page}`;
    case "link_shared":
      return `shared ${page}`;
    default:
      return `interacted with ${page}`;
  }
}

/**
 * Tokenized dot color per the design's status mapping: visits = info,
 * conversions (form/CTA/next-step) = success/positive, downloads = warning.
 * Returns a Tailwind bg-* utility (never a raw color).
 */
export function activityDotClass(type: TimelineEventType): string {
  switch (type) {
    case "first_visit":
    case "return_visit":
    case "tab_viewed":
      return "bg-info";
    case "form_submitted":
    case "cta_clicked":
    case "map_item_completed":
      return "bg-success";
    case "file_downloaded":
      return "bg-warning";
    default:
      return "bg-border-strong";
  }
}
