export interface PageLink {
  id: string;
  label: string;
  url: string;
}

export interface FormField {
  id: string;
  type: "text" | "email" | "phone" | "textarea";
  label: string;
  required: boolean;
  preset?: boolean;
}

export interface TabData {
  id: string;
  name: string;
  order: number;
  content: string;
  pageId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PageAnalytics {
  views: number;
  avgDuration: number;
  linkClicks: number;
  shares: number;
}

export interface TemplateData {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  tabs: string; // JSON string: Array<{ label: string; content: TiptapJSON }>
  isDefault: boolean;
  usageCount: number;
  createdAt: string;
}

export interface PageData {
  id: string;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  userId: string;
  tabs: TabData[];
  font: string;
  accentColor: string;
  layoutWidth: string;
  background: string;
  tabPlacement: string;
  logoUrl: string;
  coverImage: string;
  links: string;
  password?: string | null;
  tags: string;   // JSON-encoded string[]
  createdAt: string;
  updatedAt: string;
}

/** Shape used in the dashboard listing */
export interface PageListItem {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  accentColor: string;
  background: string;
  tags: string[];
  updatedAt: string;
  createdAt: string;
  user: { name: string };
  visibility?: "TEAM" | "PRIVATE";
  lockedById?: string | null;
  lockedByName?: string | null;
}

// ──── Synced Block types ────

export interface SyncedBlockListItem {
  id: string;
  name: string;
  updatedAt: string;
  createdBy: { name: string };
}

// ──── Buyer Analytics types ────

export type IntentLabel = "High Intent" | "Warm" | "Cold";

export interface SectionEngagement {
  tabId: string;
  tabName: string;
  durationSeconds: number;
  viewCount: number;
  sharePct: number; // share of the visitor's total section time (0–100)
  maxScrollPct: number; // deepest scroll within this section (0 if unknown)
}

export interface BuyerSessionSummary {
  sessionId: string;
  startedAt: string;
  durationSeconds: number;
  hasRecording: boolean;
}

export interface BuyerVisitorRow {
  visitorId: string;
  visitorHash: string; // first 8 chars of hash
  sessions: number;
  firstSeenAt: string;
  lastSeenAt: string;
  totalDurationSeconds: number;
  engagementScore: number;
  mostViewedTab: string;
  ctaClicked: boolean;
  pricingTabViewed: boolean;
  intent: IntentLabel;
  contactName?: string | null;
  contactEmail?: string | null;
  sections: SectionEngagement[];
  sessionsList: BuyerSessionSummary[];
}

export interface PageContactRow {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  refToken: string;
  createdAt: string;
  engagementScore: number;
  totalSessions: number;
  lastSeenAt: string | null;
  intent: IntentLabel | null;
}

export interface BuyerAnalyticsSummary {
  totalVisitors: number;
  uniqueReturning: number;
  highIntentCount: number;
  avgScore: number;
}

// ──── Mutual Action Plan types ────

export interface MapItemData {
  id: string;
  mapId: string;
  title: string;
  ownerType: "seller" | "buyer";
  ownerName: string;
  dueDate: string | null;
  completed: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface MutualActionPlanData {
  id: string;
  pageId: string;
  title: string;
  closeDate: string | null;
  items: MapItemData[];
  createdAt: string;
  updatedAt: string;
}

// ──── Team types ────

export interface TeamMemberData {
  id: string;
  userId: string;
  role: "OWNER" | "MEMBER";
  createdAt: string;
  user: {
    id: string;
    name: string;
    lastName: string;
    email: string;
    avatarUrl: string;
  };
}

export interface TeamInviteData {
  id: string;
  email: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED";
  expiresAt: string;
  createdAt: string;
  invitedBy: {
    name: string;
  };
}

// ──── Activity Timeline types ────

export type TimelineEventType =
  | "first_visit"
  | "return_visit"
  | "tab_viewed"
  | "cta_clicked"
  | "form_submitted"
  | "file_downloaded"
  | "link_shared"
  | "map_item_completed";

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: string;
  visitorHash: string | null;
  visitorId: string | null;
  visitorEmail: string | null;
  detail: Record<string, string | number | boolean>;
  isSeller: boolean;
}

export interface TimelineVisitor {
  id: string;
  hash: string;
  email: string | null;
}

/**
 * A workspace-level activity item for the dashboard Recent Activity feed.
 * Same event vocabulary as the per-page timeline, plus the page it belongs to
 * so a row can name and link to the page.
 */
export interface ActivityFeedItem {
  id: string;
  type: TimelineEventType;
  timestamp: string; // ISO
  actorName: string | null; // buyer contact name, if known
  actorEmail: string | null; // buyer contact email, if known
  actorHash: string | null; // short anonymous visitor hash, if no contact
  detail: Record<string, string | number | boolean>;
  page: { id: string; title: string };
}

