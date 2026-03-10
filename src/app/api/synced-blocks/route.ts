import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getUserTeamId } from "@/lib/team-auth";
import { canCreateSyncedBlock } from "@/lib/plan-limits";
import { withErrorHandler, safeJson } from "@/lib/api-error";

export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = await getUserTeamId(session.user.id);
  if (!teamId) {
    return NextResponse.json({ error: "No team found" }, { status: 400 });
  }

  const blocks = await prisma.syncedBlock.findMany({
    where: { teamId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      updatedAt: true,
      createdBy: { select: { name: true } },
    },
  });

  return NextResponse.json(blocks);
});

export const POST = withErrorHandler(async (request: Request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = await getUserTeamId(session.user.id);
  if (!teamId) {
    return NextResponse.json({ error: "No team found" }, { status: 400 });
  }

  const limitCheck = await canCreateSyncedBlock(teamId);
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: limitCheck.reason, code: "PLAN_LIMIT", current: limitCheck.current, limit: limitCheck.limit },
      { status: 403 }
    );
  }

  const body = await safeJson<{ name?: string }>(request) ?? {};
  const name = body.name || "Untitled Block";

  const block = await prisma.syncedBlock.create({
    data: {
      name,
      teamId,
      createdById: session.user.id,
    },
    include: { createdBy: { select: { name: true } } },
  });

  return NextResponse.json(block, { status: 201 });
});
