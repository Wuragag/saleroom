import { prisma } from "@/lib/prisma";
import { withResourceLock } from "@/lib/plan-limits";
import type { PipelineStage, Prisma } from "@/generated/prisma";

export { stageDeleteTarget } from "@/lib/deals";

/** Seeded for every new scope; users reshape them from there. */
export const DEFAULT_STAGE_NAMES = ["New", "Qualified", "Proposal", "Negotiation"];

export const MAX_STAGES = 8;
export const STAGE_NAME_MAX = 40;

/** Stages are scoped like deals: the team, or the teamless user. */
export function stageScopeWhere(
  userId: string,
  teamId: string | null
): Prisma.PipelineStageWhereInput {
  return teamId ? { teamId } : { userId };
}

/** Advisory-lock key serializing stage creation/deletion for a scope. */
export function stageLockKey(userId: string, teamId: string | null): string {
  return teamId ? `team:${teamId}:stages` : `user:${userId}:stages`;
}

/**
 * The scope's stages in board order, creating the defaults on first touch.
 * Locked so concurrent first requests can't double-seed.
 */
export async function ensurePipelineStages(
  userId: string,
  teamId: string | null
): Promise<PipelineStage[]> {
  const where = stageScopeWhere(userId, teamId);
  const existing = await prisma.pipelineStage.findMany({
    where,
    orderBy: { order: "asc" },
  });
  if (existing.length > 0) return existing;

  return withResourceLock(stageLockKey(userId, teamId), async (tx) => {
    const again = await tx.pipelineStage.findMany({
      where,
      orderBy: { order: "asc" },
    });
    if (again.length > 0) return again;
    await tx.pipelineStage.createMany({
      data: DEFAULT_STAGE_NAMES.map((name, i) => ({
        name,
        order: i,
        teamId: teamId ?? null,
        userId: teamId ? null : userId,
      })),
    });
    return tx.pipelineStage.findMany({ where, orderBy: { order: "asc" } });
  });
}

