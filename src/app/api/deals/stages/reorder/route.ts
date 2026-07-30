import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getUserTeamId } from "@/lib/team-auth";
import { withErrorHandler, safeJson } from "@/lib/api-error";
import { stageScopeWhere } from "@/lib/pipeline-stages";

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

  const existing = await prisma.pipelineStage.findMany({
    where: stageScopeWhere(session.user.id, teamId),
    select: { id: true },
  });
  const existingIds = new Set(existing.map((s) => s.id));
  const exactPermutation =
    stageIds.length === existingIds.size &&
    stageIds.every((id) => existingIds.has(id)) &&
    new Set(stageIds).size === stageIds.length;
  if (!exactPermutation) {
    return NextResponse.json(
      { error: "stageIds must include every column exactly once" },
      { status: 400 }
    );
  }

  await prisma.$transaction(
    stageIds.map((id, index) =>
      prisma.pipelineStage.update({ where: { id }, data: { order: index } })
    )
  );

  return NextResponse.json({ ok: true });
});
