import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserTeamId } from "@/lib/team-auth";
import { withErrorHandler, safeJson } from "@/lib/api-error";
import { withResourceLock } from "@/lib/plan-limits";
import {
  MAX_STAGES,
  STAGE_NAME_MAX,
  ensurePipelineStages,
  stageLockKey,
  stageScopeWhere,
} from "@/lib/pipeline-stages";
import { cleanString } from "@/lib/validation";

/** GET /api/deals/stages — the scope's columns, seeding defaults on first use. */
export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const teamId = await getUserTeamId(session.user.id);
  const stages = await ensurePipelineStages(session.user.id, teamId);
  return NextResponse.json(
    stages.map((s) => ({ id: s.id, name: s.name, order: s.order }))
  );
});

/** POST /api/deals/stages — add a column at the end (any team member). */
export const POST = withErrorHandler(async (request: Request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await safeJson<{ name?: unknown }>(request)) ?? {};
  const name = cleanString(body.name, STAGE_NAME_MAX);
  if (!name) {
    return NextResponse.json({ error: "Column name is required" }, { status: 400 });
  }

  const teamId = await getUserTeamId(session.user.id);
  await ensurePipelineStages(session.user.id, teamId);

  try {
    const stage = await withResourceLock(
      stageLockKey(session.user.id, teamId),
      async (tx) => {
        const existing = await tx.pipelineStage.findMany({
          where: stageScopeWhere(session.user.id, teamId),
          orderBy: { order: "desc" },
        });
        if (existing.length >= MAX_STAGES) {
          throw new TooManyStagesError();
        }
        return tx.pipelineStage.create({
          data: {
            name,
            order: (existing[0]?.order ?? -1) + 1,
            teamId: teamId ?? null,
            userId: teamId ? null : session.user.id,
          },
        });
      }
    );
    return NextResponse.json(
      { id: stage.id, name: stage.name, order: stage.order },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof TooManyStagesError) {
      return NextResponse.json(
        { error: `A pipeline can have at most ${MAX_STAGES} columns.` },
        { status: 400 }
      );
    }
    throw err;
  }
});

class TooManyStagesError extends Error {}
