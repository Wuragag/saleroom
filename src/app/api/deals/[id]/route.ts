import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkDealAccess } from "@/lib/deal-auth";
import { getUserTeamId } from "@/lib/team-auth";
import { withErrorHandler, safeJson } from "@/lib/api-error";
import { getDealDetail } from "@/lib/deal-queries";
import { STATUS_LABELS } from "@/lib/deals";
import { resolveCompany } from "@/lib/contacts";
import { cleanString } from "@/lib/validation";
import {
  assertCanCreateDealTx,
  dealLockKey,
  withResourceLock,
} from "@/lib/plan-limits";
import type { DealStatus, Prisma } from "@/generated/prisma";

function accessStatus(access: { session: unknown; reason?: string }): number {
  return !access.session ? 401 : access.reason === "Deal not found" ? 404 : 403;
}

const OWNER_INCLUDE = {
  owner: { select: { id: true, name: true, lastName: true, avatarUrl: true } },
} as const;

interface PatchDealBody {
  name?: unknown;
  company?: unknown;
  value?: unknown;
  stageId?: unknown;
  status?: unknown;
  expectedCloseDate?: unknown;
  ownerId?: unknown;
}

/** GET /api/deals/[id] — full detail (rooms, stakeholders, MAPs, rollup) */
export const GET = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const access = await checkDealAccess(id, "view");
  if (!access.authorized) {
    return NextResponse.json({ error: access.reason }, { status: accessStatus(access) });
  }
  const viewerId: string = access.session.user.id;
  const teamId = await getUserTeamId(viewerId);
  const deal = await getDealDetail(id, viewerId, teamId);
  return NextResponse.json(deal);
});

/** PATCH /api/deals/[id] — edit fields, move stage, mark won/lost/reopen */
export const PATCH = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const access = await checkDealAccess(id, "edit");
  if (!access.authorized) {
    return NextResponse.json({ error: access.reason }, { status: accessStatus(access) });
  }

  const body = (await safeJson<PatchDealBody>(request)) ?? {};
  const data: Prisma.DealUpdateInput = {};

  if (body.name !== undefined) {
    const name = cleanString(body.name, 200);
    if (!name) {
      return NextResponse.json({ error: "Deal name is required" }, { status: 400 });
    }
    data.name = name;
  }

  if (body.company !== undefined) {
    const company = cleanString(body.company, 200);
    if (company === null) {
      return NextResponse.json({ error: "Invalid company" }, { status: 400 });
    }
    // Clearing the field unlinks; a name resolves to (or creates) a Company.
    if (!company) {
      data.company = { disconnect: true };
    } else {
      const companyId = await resolveCompany(
        { teamId: access.deal.teamId, userId: access.deal.ownerId },
        company
      );
      data.company = companyId ? { connect: { id: companyId } } : { disconnect: true };
    }
  }

  if (body.value !== undefined) {
    if (body.value === null) {
      data.value = null;
    } else if (
      typeof body.value === "number" &&
      Number.isFinite(body.value) &&
      body.value >= 0 &&
      body.value <= 2_000_000_000
    ) {
      data.value = Math.round(body.value);
    } else {
      return NextResponse.json({ error: "Invalid deal value" }, { status: 400 });
    }
  }

  if (body.stageId !== undefined && body.stageId !== access.deal.stageId) {
    if (typeof body.stageId !== "string") {
      return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
    }
    // The stage must belong to the deal's scope (its team, or its teamless owner).
    const stage = await prisma.pipelineStage.findFirst({
      where: {
        id: body.stageId,
        ...(access.deal.teamId
          ? { teamId: access.deal.teamId }
          : { userId: access.deal.ownerId }),
      },
    });
    if (!stage) {
      return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
    }
    data.stage = { connect: { id: stage.id } };
    data.stageEnteredAt = new Date();
  }

  if (body.status !== undefined) {
    if (
      typeof body.status !== "string" ||
      !Object.prototype.hasOwnProperty.call(STATUS_LABELS, body.status)
    ) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const status = body.status as DealStatus;
    // Idempotent: re-sending the current status (e.g. from a stale tab) must
    // not rewrite closedAt.
    if (status !== access.deal.status) {
      data.status = status;
      data.closedAt = status === "OPEN" ? null : new Date();
      // Reopening restarts the clock on its (unchanged) stage.
      if (status === "OPEN") data.stageEnteredAt = new Date();
    }
  }

  if (body.expectedCloseDate !== undefined) {
    if (body.expectedCloseDate === null) {
      data.expectedCloseDate = null;
    } else if (typeof body.expectedCloseDate !== "string") {
      return NextResponse.json({ error: "Invalid close date" }, { status: 400 });
    } else {
      const date = new Date(body.expectedCloseDate);
      if (isNaN(date.getTime())) {
        return NextResponse.json({ error: "Invalid close date" }, { status: 400 });
      }
      data.expectedCloseDate = date;
    }
  }

  if (body.ownerId !== undefined && body.ownerId !== access.deal.ownerId) {
    if (typeof body.ownerId !== "string" || !access.deal.teamId) {
      return NextResponse.json({ error: "Invalid owner" }, { status: 400 });
    }
    // Only the current owner or a team OWNER may reassign ownership —
    // otherwise any member could self-assign and then use the owner's
    // delete privilege.
    const actorId: string = access.session.user.id;
    if (access.deal.ownerId !== actorId) {
      const actorMembership = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId: actorId, teamId: access.deal.teamId } },
      });
      if (actorMembership?.role !== "OWNER") {
        return NextResponse.json(
          { error: "Only the deal owner or team owner can reassign ownership" },
          { status: 403 }
        );
      }
    }
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: body.ownerId, teamId: access.deal.teamId } },
    });
    if (!membership) {
      return NextResponse.json(
        { error: "Owner must be a team member" },
        { status: 400 }
      );
    }
    data.owner = { connect: { id: body.ownerId } };
  }

  // Reopening puts the deal back in the open-pipeline count, so it re-checks
  // the plan cap under the same advisory lock as create (otherwise
  // create→close→create→reopen would make the FREE cap meaningless).
  const deal =
    data.status === "OPEN"
      ? await withResourceLock(
          dealLockKey(access.deal.teamId, access.deal.ownerId),
          async (tx) => {
            await assertCanCreateDealTx(tx, access.deal.teamId, access.deal.ownerId);
            return tx.deal.update({ where: { id }, data, include: OWNER_INCLUDE });
          }
        )
      : await prisma.deal.update({ where: { id }, data, include: OWNER_INCLUDE });

  return NextResponse.json(deal);
});

/** DELETE /api/deals/[id] — rooms survive (Page.dealId is SetNull) */
export const DELETE = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const access = await checkDealAccess(id, "delete");
  if (!access.authorized) {
    return NextResponse.json({ error: access.reason }, { status: accessStatus(access) });
  }
  await prisma.deal.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
});
