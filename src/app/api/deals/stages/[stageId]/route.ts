import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getUserTeamId } from "@/lib/team-auth";
import { withErrorHandler, safeJson } from "@/lib/api-error";
import { withResourceLock } from "@/lib/plan-limits";
import {
  STAGE_NAME_MAX,
  stageDeleteTarget,
  stageLockKey,
  stageScopeWhere,
} from "@/lib/pipeline-stages";
import { cleanString } from "@/lib/validation";

async function requireScope() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const teamId = await getUserTeamId(session.user.id);
  return { userId: session.user.id as string, teamId };
}

/** PATCH /api/deals/stages/[stageId] — rename a column. */
export const PATCH = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ stageId: string }> }
) => {
  const { stageId } = await params;
  const scope = await requireScope();
  if (!scope) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await safeJson<{ name?: unknown }>(request)) ?? {};
  const name = cleanString(body.name, STAGE_NAME_MAX);
  if (!name) {
    return NextResponse.json({ error: "Column name is required" }, { status: 400 });
  }

  // Scope guard doubles as the 404 for foreign stages.
  const updated = await prisma.pipelineStage.updateMany({
    where: { id: stageId, ...stageScopeWhere(scope.userId, scope.teamId) },
    data: { name },
  });
  if (updated.count === 0) {
    return NextResponse.json({ error: "Column not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
});

/**
 * DELETE /api/deals/stages/[stageId] — remove a column; its deals move to the
 * neighboring column (previous by order, else next) with their stage timers
 * preserved. The last remaining column can't be deleted.
 */
export const DELETE = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ stageId: string }> }
) => {
  const { stageId } = await params;
  const scope = await requireScope();
  if (!scope) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await withResourceLock(
      stageLockKey(scope.userId, scope.teamId),
      async (tx) => {
        const stages = await tx.pipelineStage.findMany({
          where: stageScopeWhere(scope.userId, scope.teamId),
          orderBy: { order: "asc" },
        });
        const stage = stages.find((s) => s.id === stageId);
        if (!stage) throw new StageNotFoundError();
        if (stages.length <= 1) throw new LastStageError();

        const targetId = stageDeleteTarget(stages, stageId);
        if (!targetId) throw new LastStageError();

        // Timer deliberately untouched — a forced move isn't progress.
        const moved = await tx.deal.updateMany({
          where: { stageId },
          data: { stageId: targetId },
        });
        await tx.pipelineStage.delete({ where: { id: stageId } });
        const target = stages.find((s) => s.id === targetId);
        return { moved: moved.count, movedTo: target?.name ?? "" };
      }
    );
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof StageNotFoundError) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }
    if (err instanceof LastStageError) {
      return NextResponse.json(
        { error: "A pipeline needs at least one column." },
        { status: 400 }
      );
    }
    throw err;
  }
});

class StageNotFoundError extends Error {}
class LastStageError extends Error {}
