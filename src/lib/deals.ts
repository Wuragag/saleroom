import type { DealStatus } from "@/generated/prisma";
import type { DealListItem, DealStatusValue } from "@/types";

// Stages are user-managed PipelineStage rows (src/lib/pipeline-stages.ts) —
// this module holds the pure pipeline logic that works over their ids.

export const STATUS_LABELS: Record<DealStatus, string> = {
  OPEN: "Open",
  WON: "Won",
  LOST: "Lost",
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Format a deal value (whole currency units) as e.g. "$12,500"; "—" when unset. */
export function formatDealValue(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return currency.format(value);
}

export const DAY_MS = 86_400_000;

/** Overdue starts the day AFTER the close date — "due today" isn't late yet. */
export function isOverdue(
  deal: { expectedCloseDate: string | null; status: DealStatusValue },
  now: number = Date.now()
): boolean {
  return (
    deal.status === "OPEN" &&
    !!deal.expectedCloseDate &&
    new Date(deal.expectedCloseDate).getTime() + DAY_MS < now
  );
}

/** How long a deal has sat in its current stage: "<1h", "5h", "3d". */
export function formatStageAge(
  enteredAtIso: string,
  now: number = Date.now()
): string {
  const ms = Math.max(0, now - new Date(enteredAtIso).getTime());
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours < 1) return "<1h";
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

// ──── Pipeline filters (pure — the workspace toolbar drives these) ────

export type WarmthFilter = "high" | "warm" | "cold" | "none";
export type CloseDateFilter = "overdue" | "soon" | "none";

export const WARMTH_FILTERS: { value: WarmthFilter; label: string }[] = [
  { value: "high", label: "High Intent" },
  { value: "warm", label: "Warm" },
  { value: "cold", label: "Cold" },
  { value: "none", label: "No activity" },
];

export const CLOSE_DATE_FILTERS: { value: CloseDateFilter; label: string }[] = [
  { value: "overdue", label: "Overdue" },
  { value: "soon", label: "Due in 30 days" },
  { value: "none", label: "No close date" },
];

export interface DealFilters {
  /** Matches name or company, case-insensitive. */
  query?: string;
  ownerId?: string | null;
  warmth?: WarmthFilter | null;
  closeDate?: CloseDateFilter | null;
  status?: DealStatusValue | null;
  stageId?: string | null;
}

function matchesWarmth(deal: DealListItem, warmth: WarmthFilter): boolean {
  const intent = deal.engagement.intent;
  if (warmth === "high") return intent === "High Intent";
  if (warmth === "warm") return intent === "Warm";
  if (warmth === "cold") return intent === "Cold";
  return intent === null;
}

function matchesCloseDate(
  deal: DealListItem,
  filter: CloseDateFilter,
  now: number
): boolean {
  if (filter === "none") return deal.expectedCloseDate === null;
  if (filter === "overdue") return isOverdue(deal, now);
  // "soon": open and due inside the next 30 days — overdue deals included,
  // they need attention most.
  return (
    deal.status === "OPEN" &&
    !!deal.expectedCloseDate &&
    new Date(deal.expectedCloseDate).getTime() <= now + 30 * DAY_MS
  );
}

/** Apply the pipeline toolbar's filters; unset (null/undefined) means "all". */
export function filterDeals(
  deals: DealListItem[],
  filters: DealFilters,
  now: number = Date.now()
): DealListItem[] {
  const q = filters.query?.trim().toLowerCase() ?? "";
  return deals.filter((deal) => {
    if (filters.ownerId && deal.owner.id !== filters.ownerId) return false;
    if (filters.status && deal.status !== filters.status) return false;
    // Stage is retained on closed deals, so this also answers "which deals
    // closed at Proposal" when combined with the Won/Lost pills.
    if (filters.stageId && deal.stage.id !== filters.stageId) return false;
    if (filters.warmth && !matchesWarmth(deal, filters.warmth)) return false;
    if (filters.closeDate && !matchesCloseDate(deal, filters.closeDate, now)) {
      return false;
    }
    if (
      q &&
      !deal.name.toLowerCase().includes(q) &&
      !deal.company.toLowerCase().includes(q)
    ) {
      return false;
    }
    return true;
  });
}

/**
 * Pure: where a deleted column's deals land — the previous column by order,
 * else the next one. Null when the stage isn't found or is the last one left.
 * (Client-safe; the server-side stage helpers in pipeline-stages.ts use it too.)
 */
export function stageDeleteTarget(
  stages: { id: string; order: number }[],
  deletingId: string
): string | null {
  const sorted = [...stages].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((s) => s.id === deletingId);
  if (idx === -1 || sorted.length < 2) return null;
  return (sorted[idx - 1] ?? sorted[idx + 1]).id;
}

// ──── Board moves ────

/** A board column: a PipelineStage id, or the two terminal status columns. */
export type BoardColumnId = string;

export interface BoardMovePatch {
  stageId?: string;
  status?: DealStatus;
}

/**
 * The PATCH needed to drop a deal into a board column; null when it's a no-op.
 * Dropping a closed deal onto a stage column reopens it.
 */
export function boardMovePatch(
  deal: { stageId: string; status: DealStatus },
  column: BoardColumnId
): BoardMovePatch | null {
  if (column === "WON" || column === "LOST") {
    return deal.status === column ? null : { status: column };
  }
  if (deal.status !== "OPEN") {
    return { status: "OPEN", stageId: column };
  }
  return deal.stageId === column ? null : { stageId: column };
}
