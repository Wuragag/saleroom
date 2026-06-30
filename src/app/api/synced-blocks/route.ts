import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getUserTeamId } from "@/lib/team-auth";
import { assertCanCreateSyncedBlockTx, withResourceLock } from "@/lib/plan-limits";
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

  const body = await safeJson<{ name?: string }>(request) ?? {};
  const name = body.name || "Untitled Block";

  // Atomic plan-limit enforcement + create (prevents concurrent over-creation).
  const block = await withResourceLock(
    `team:${teamId}:synced-blocks`,
    async (tx) => {
      await assertCanCreateSyncedBlockTx(tx, teamId);
      return tx.syncedBlock.create({
        data: {
          name,
          teamId,
          createdById: session.user.id,
        },
        include: { createdBy: { select: { name: true } } },
      });
    }
  );

  return NextResponse.json(block, { status: 201 });
});
