import { describe, it, expect } from "vitest";
import {
  activityActor,
  activityPredicate,
  activityDotClass,
} from "@/lib/activity-feed";
import type { ActivityFeedItem, TimelineEventType } from "@/types";

function item(overrides: Partial<ActivityFeedItem> = {}): ActivityFeedItem {
  return {
    id: "sv-1",
    type: "first_visit",
    timestamp: "2026-07-06T12:00:00.000Z",
    actorName: null,
    actorEmail: null,
    actorHash: null,
    detail: {},
    page: { id: "p1", title: "Acme Proposal" },
    ...overrides,
  };
}

describe("activityActor", () => {
  it("prefers a contact name", () => {
    expect(
      activityActor(item({ actorName: "Sarah Kim", actorEmail: "s@acme.com" }))
    ).toBe("Sarah Kim");
  });

  it("falls back to email when there is no name", () => {
    expect(activityActor(item({ actorEmail: "buyer@acme.com" }))).toBe(
      "buyer@acme.com"
    );
  });

  it("labels an anonymous visitor by hash", () => {
    expect(activityActor(item({ actorHash: "a1b2c3d4" }))).toBe(
      "Visitor a1b2c3d4"
    );
  });

  it("uses a neutral noun when nothing is known", () => {
    expect(activityActor(item())).toBe("Someone");
  });
});

describe("activityPredicate", () => {
  it("names the page for a first visit", () => {
    expect(activityPredicate(item({ type: "first_visit" }))).toBe(
      "opened Acme Proposal"
    );
  });

  it("appends a human duration when present", () => {
    expect(
      activityPredicate(item({ type: "first_visit", detail: { duration: 135 } }))
    ).toBe("opened Acme Proposal for 2m 15s");
  });

  it("omits duration when zero or missing", () => {
    expect(
      activityPredicate(item({ type: "return_visit", detail: { duration: 0 } }))
    ).toBe("came back to Acme Proposal");
  });

  it("describes conversions", () => {
    expect(activityPredicate(item({ type: "form_submitted" }))).toBe(
      "submitted the form on Acme Proposal"
    );
    expect(activityPredicate(item({ type: "cta_clicked" }))).toBe(
      "clicked a call-to-action on Acme Proposal"
    );
    expect(activityPredicate(item({ type: "map_item_completed" }))).toBe(
      "completed a next step on Acme Proposal"
    );
  });
});

describe("activityDotClass", () => {
  const cases: [TimelineEventType, string][] = [
    ["first_visit", "bg-info"],
    ["return_visit", "bg-info"],
    ["form_submitted", "bg-success"],
    ["cta_clicked", "bg-success"],
    ["map_item_completed", "bg-success"],
    ["file_downloaded", "bg-warning"],
    ["link_shared", "bg-border-strong"],
  ];
  it.each(cases)("maps %s → %s", (type, expected) => {
    expect(activityDotClass(type)).toBe(expected);
  });
});
