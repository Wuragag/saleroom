import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserTeamId } from "@/lib/team-auth";
import { withErrorHandler, safeJson } from "@/lib/api-error";
import { withResourceLock } from "@/lib/plan-limits";
import { stageLockKey, stageScopeWhere } from "@/lib/pipeline-stages";

/**
 * PUT /api/deals/stages/reorder — { stageIds }: the full column order. Must be
 * an exact permutation of the scope's stages (mirrors map/items/reorder).
 */
export const PUT = withErrorHandler(async (request: Request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const teamId = await getUserTeamId(session.user.id);

  const body = (await safeJson<{ stageIds?: unknown }>(request)) ?? {};
  if (
    !Array.isArray(body.stageIds) ||
    body.stageIds.some((id) => typeof id !== "string")
  ) {
    return NextResponse.json({ error: "stageIds is required" }, { status: 400 });
  }
  const stageIds = body.stageIds as string[];

  // Same lock as create/delete, so a concurrent column change can't turn this
  // into a P2025 or leave order values non-contiguous.
  try {
    await withResourceLock(stageLockKey(session.user.id, teamId), async (tx) => {
      const existing = await tx.pipelineStage.findMany({
        where: stageScopeWhere(session.user.id, teamId),
        select: { id: true },
      });
      const existingIds = new Set(existing.map((s) => s.id));
      const exactPermutation =
        stageIds.length === existingIds.size &&
        stageIds.every((id) => existingIds.has(id)) &&
        new Set(stageIds).size === stageIds.length;
      if (!exactPermutation) throw new StaleOrderError();

      for (const [index, id] of stageIds.entries()) {
        await tx.pipelineStage.update({ where: { id }, data: { order: index } });
      }
    });
  } catch (err) {
    if (err instanceof StaleOrderError) {
      return NextResponse.json(
        { error: "Your columns changed — reopen the dialog and try again." },
        { status: 409 }
      );
    }
    throw err;
  }

  return NextResponse.json({ ok: true });
});

class StaleOrderError extends Error {}
