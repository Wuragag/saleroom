import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import type { Prisma } from "@/generated/prisma";

export type DealPermission = "view" | "edit" | "delete";

/**
 * The Prisma `where` for deals a user may see: every deal in their team (deals
 * are always team-visible — no PRIVATE deals), or, with no team, only deals
 * they own. Single source of truth for the pipeline list and the deal APIs.
 */
export function accessibleDealWhere(
  userId: string,
  teamId: string | null
): Prisma.DealWhereInput {
  return teamId ? { teamId } : { ownerId: userId };
}

/**
 * Whether the viewer can open a deal-linked page itself — a pure, read-only
 * mirror of checkPageAccess's "view" rule (PRIVATE = creator-only; TEAM =
 * members of the page's team; legacy teamless = creator-only). Deal surfaces
 * use it to keep page-gated content (contacts, action-plan items, room links)
 * behind the page ACL while still showing the title + engagement summary.
 */
export function canViewLinkedPage(
  page: { visibility: string; userId: string; teamId: string | null },
  viewerId: string,
  viewerTeamId: string | null
): boolean {
  if (page.visibility === "PRIVATE") return page.userId === viewerId;
  if (page.teamId) return page.teamId === viewerTeamId;
  return page.userId === viewerId;
}

interface DealAuthResult {
  authorized: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deal?: any;
  reason?: string;
}

/**
 * Check whether the current user can perform `action` on a deal.
 *
 * Rules (mirrors checkPageAccess, minus visibility/locking — deals are
 * team-visible by design):
 * - Team deals: VIEW/EDIT any team member; DELETE only the deal owner or a
 *   team OWNER.
 * - Deals without a teamId (legacy teamless users): owner-only.
 */
export async function checkDealAccess(
  dealId: string,
  action: DealPermission
): Promise<DealAuthResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { authorized: false, session: null, reason: "Unauthorized" };
  }

  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) {
    return { authorized: false, session, reason: "Deal not found" };
  }

  const isOwner = deal.ownerId === session.user.id;

  if (deal.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: { userId: session.user.id, teamId: deal.teamId },
      },
    });

    if (!membership) {
      return { authorized: false, session, deal, reason: "Not a team member" };
    }

    if (action === "delete") {
      const isTeamOwner = membership.role === "OWNER";
      return {
        authorized: isOwner || isTeamOwner,
        session,
        deal,
        reason:
          isOwner || isTeamOwner
            ? undefined
            : "Only the deal owner or team owner can delete",
      };
    }

    return { authorized: true, session, deal };
  }

  // No team — owner-only for every action
  return {
    authorized: isOwner,
    session,
    deal,
    reason: isOwner ? undefined : "Forbidden",
  };
}
