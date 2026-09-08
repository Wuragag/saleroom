import type { MapItem, MutualActionPlan } from "@/generated/prisma";
import type { MutualActionPlanData } from "@/types";

export type MapRecord = MutualActionPlan & { items: MapItem[] };

/**
 * Prisma Mutual Action Plan row → the JSON shape MapViewer/MapPanel consume
 * (ISO dates, typed owner). Shared by /p/[slug] and /preview/[id], which both
 * render the plan server-side so buyers never see a loading skeleton.
 */
export function serializeMap(record: MapRecord | null): MutualActionPlanData | null {
  if (!record) return null;
  return {
    ...record,
    closeDate: record.closeDate?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    items: record.items.map((item) => ({
      ...item,
      ownerType: item.ownerType === "buyer" ? "buyer" : "seller",
      dueDate: item.dueDate?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
  };
}
