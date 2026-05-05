import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserTeamId } from "@/lib/team-auth";
import { safeJson } from "@/lib/api-error";
import { withAuth } from "@/lib/api-auth";

async function verifyBlockAccess(blockId: string, userId: string) {
  const teamId = await getUserTeamId(userId);
  if (!teamId) return null;

  const block = await prisma.syncedBlock.findUnique({
    where: { id: blockId },
    include: { createdBy: { select: { name: true } } },
  });

  if (!block || block.teamId !== teamId) return null;
  return block;
}

export const GET = withAuth<{ id: string }>(async (_request, { params, session }) => {
  const { id } = await params;
  const block = await verifyBlockAccess(id, session.user.id);
  if (!block) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(block);
});

export const PUT = withAuth<{ id: string }>(async (request, { params, session }) => {
  const { id } = await params;
  const block = await verifyBlockAccess(id, session.user.id);
  if (!block) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await safeJson<{ name?: string; content?: string }>(request) ?? {};
  const data: { name?: string; content?: string } = {};

  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.content === "string") {
    // Prevent nested synced blocks
    try {
      const parsed = JSON.parse(body.content);
      if (JSON.stringify(parsed).includes('"syncedBlock"')) {
        return NextResponse.json(
          { error: "Synced blocks cannot contain other synced blocks" },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json({ error: "Invalid content JSON" }, { status: 400 });
    }
    data.content = body.content;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(block);
  }

  const updated = await prisma.syncedBlock.update({
    where: { id },
    data,
    include: { createdBy: { select: { name: true } } },
  });

  return NextResponse.json(updated);
});

export const DELETE = withAuth<{ id: string }>(async (_request, { params, session }) => {
  const { id } = await params;
  const block = await verifyBlockAccess(id, session.user.id);
  if (!block) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.syncedBlock.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
