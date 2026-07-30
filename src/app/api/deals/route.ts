import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkPageAccess, getUserTeamId } from "@/lib/team-auth";
import {
  assertCanCreateDealTx,
  dealLockKey,
  withResourceLock,
} from "@/lib/plan-limits";
import { withErrorHandler, safeJson } from "@/lib/api-error";
import { listDealsWithRollups } from "@/lib/deal-queries";
import { ensurePipelineStages } from "@/lib/pipeline-stages";
import { cleanString } from "@/lib/validation";

/** Thrown inside the create transaction when the room got linked concurrently. */
class RoomAlreadyLinkedError extends Error {}

interface CreateDealBody {
  name?: unknown;
  company?: unknown;
  value?: unknown;
  stageId?: unknown;
  expectedCloseDate?: unknown;
  ownerId?: unknown;
  /** Optional room to link on creation ("create a deal from a room"). */
  pageId?: unknown;
}

function parseValue(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const rounded = Math.round(value);
  if (rounded < 0 || rounded > 2_000_000_000) return undefined;
  return rounded;
}

export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const teamId = await getUserTeamId(session.user.id);
  const deals = await listDealsWithRollups(session.user.id, teamId);
  return NextResponse.json(deals);
});

export const POST = withErrorHandler(async (request: Request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = (await safeJson<CreateDealBody>(request)) ?? {};
  const name = cleanString(body.name, 200);
  if (!name) {
    return NextResponse.json({ error: "Deal name is required" }, { status: 400 });
  }

  const company = body.company === undefined ? "" : cleanString(body.company, 200);
  if (company === null) {
    return NextResponse.json({ error: "Invalid company" }, { status: 400 });
  }

  const value = parseValue(body.value ?? null);
  if (value === undefined) {
    return NextResponse.json({ error: "Invalid deal value" }, { status: 400 });
  }

  let expectedCloseDate: Date | null = null;
  if (body.expectedCloseDate !== undefined && body.expectedCloseDate !== null) {
    if (typeof body.expectedCloseDate !== "string") {
      return NextResponse.json({ error: "Invalid close date" }, { status: 400 });
    }
    expectedCloseDate = new Date(body.expectedCloseDate);
    if (isNaN(expectedCloseDate.getTime())) {
      return NextResponse.json({ error: "Invalid close date" }, { status: 400 });
    }
  }

  if (body.pageId !== undefined && typeof body.pageId !== "string") {
    return NextResponse.json({ error: "Invalid pageId" }, { status: 400 });
  }
  const pageId = body.pageId as string | undefined;

  const teamId = await getUserTeamId(userId);

  // The scope's columns (seeded on first touch); default to the first one.
  const stages = await ensurePipelineStages(userId, teamId);
  let stageId = stages[0]?.id;
  if (body.stageId !== undefined) {
    if (
      typeof body.stageId !== "string" ||
      !stages.some((s) => s.id === body.stageId)
    ) {
      return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
    }
    stageId = body.stageId;
  }
  if (!stageId) {
    return NextResponse.json({ error: "No pipeline columns exist" }, { status: 400 });
  }

  // Owner defaults to the creator; anyone else must be a teammate.
  if (body.ownerId !== undefined && typeof body.ownerId !== "string") {
    return NextResponse.json({ error: "Invalid owner" }, { status: 400 });
  }
  const ownerId = (body.ownerId as string | undefined) ?? userId;
  if (ownerId !== userId) {
    if (!teamId) {
      return NextResponse.json({ error: "Invalid owner" }, { status: 400 });
    }
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: ownerId, teamId } },
    });
    if (!membership) {
      return NextResponse.json(
        { error: "Owner must be a team member" },
        { status: 400 }
      );
    }
  }

  // Optional room link — verify the caller can edit the page and it is free.
  if (pageId) {
    const access = await checkPageAccess(pageId, "edit");
    if (!access.authorized) {
      const status = access.reason === "Page not found" ? 404 : 403;
      return NextResponse.json({ error: access.reason }, { status });
    }
    if (access.page.dealId) {
      return NextResponse.json(
        { error: "This room is already linked to a deal" },
        { status: 409 }
      );
    }
  }

  try {
    const deal = await withResourceLock(dealLockKey(teamId, userId), async (tx) => {
      await assertCanCreateDealTx(tx, teamId, userId);
      const created = await tx.deal.create({
        data: {
          name,
          company,
          value,
          stageId,
          expectedCloseDate,
          ownerId,
          teamId,
        },
        include: {
          owner: { select: { id: true, name: true, lastName: true, avatarUrl: true } },
        },
      });
      if (pageId) {
        // dealId-null guard closes the race with a concurrent link.
        const linked = await tx.page.updateMany({
          where: { id: pageId, dealId: null },
          data: { dealId: created.id },
        });
        if (linked.count === 0) throw new RoomAlreadyLinkedError();
      }
      return created;
    });
    return NextResponse.json(deal, { status: 201 });
  } catch (err) {
    if (err instanceof RoomAlreadyLinkedError) {
      return NextResponse.json(
        { error: "This room is already linked to a deal" },
        { status: 409 }
      );
    }
    throw err;
  }
});
