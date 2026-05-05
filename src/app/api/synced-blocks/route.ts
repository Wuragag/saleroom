import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserTeamId } from "@/lib/team-auth";
import { canCreateSyncedBlock } from "@/lib/plan-limits";
import { safeJson } from "@/lib/api-error";
import { withAuth } from "@/lib/api-auth";

export const GET = withAuth(async (_request, { session }) => {
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

export const POST = withAuth(async (request, { session }) => {
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
