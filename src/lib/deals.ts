import type { DealStage, DealStatus } from "@/generated/prisma";

/**
 * Fixed pipeline stages, in board order. Deliberately not user-customizable —
 * Deals is a lightweight layer on top of rooms, not a CRM.
 */
export const DEAL_STAGES: { value: DealStage; label: string }[] = [
  { value: "NEW", label: "New" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "PROPOSAL", label: "Proposal" },
  { value: "NEGOTIATION", label: "Negotiation" },
];

export const STAGE_LABELS: Record<DealStage, string> = Object.fromEntries(
  DEAL_STAGES.map((s) => [s.value, s.label])
) as Record<DealStage, string>;

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

/** A pipeline-board column: the four stages plus the two terminal statuses. */
export type BoardColumnId = DealStage | "WON" | "LOST";

export interface BoardMovePatch {
  stage?: DealStage;
  status?: DealStatus;
}

/**
 * The PATCH needed to drop a deal into a board column; null when it's a no-op.
 * Dropping a closed deal onto a stage column reopens it.
 */
export function boardMovePatch(
  deal: { stage: DealStage; status: DealStatus },
  column: BoardColumnId
): BoardMovePatch | null {
  if (column === "WON" || column === "LOST") {
    return deal.status === column ? null : { status: column };
  }
  if (deal.status !== "OPEN") {
    return { status: "OPEN", stage: column };
  }
  return deal.stage === column ? null : { stage: column };
}
