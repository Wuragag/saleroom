import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import type { Prisma } from "@/generated/prisma";

export type PagePermission = "view" | "edit" | "delete";

/**
 * The Prisma `where` for pages a user may see in their workspace: every TEAM
 * page in their team plus their own PRIVATE pages (or, with no team, only their
 * own pages). Single source of truth so the dashboard list and the activity
 * feed can never diverge on who-can-see-what.
 */
export function accessiblePageWhere(
  userId: string,
  teamId: string | null
): Prisma.PageWhereInput {
  return teamId
    ? {
        OR: [
          { teamId, visibility: "TEAM" },
          { userId, visibility: "PRIVATE" },
        ],
      }
    : { userId };
}

interface AuthResult {
  authorized: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page?: any;
  reason?: string;
}

/**
 * Check whether the current user can perform `action` on a given page.
 *
 * Rules:
 * - Private pages (visibility === "PRIVATE"): only the page creator (userId) can view/edit/delete.
 * - Team pages (visibility === "TEAM"):
 *     - VIEW: any team member
 *     - EDIT: if locked (lockedById !== null), only the locking user; otherwise any team member
 *     - DELETE: only the page creator or the team OWNER
 * - Pages without a teamId: fallback to legacy creator-only check.
 */
export async function checkPageAccess(
  pageId: string,
  action: PagePermission
): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { authorized: false, session: null, reason: "Unauthorized" };
  }

  const page = await prisma.page.findUnique({
    where: { id: pageId },
  });

  if (!page) {
    return { authorized: false, session, reason: "Page not found" };
  }

  const isCreator = page.userId === session.user.id;

  // Private page: only creator has any access
  if (page.visibility === "PRIVATE") {
    return {
      authorized: isCreator,
      session,
      page,
      reason: isCreator ? undefined : "This is a private page",
    };
  }

  // Team page: check team membership
  if (page.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId: page.teamId,
        },
      },
    });

    if (!membership) {
      return { authorized: false, session, page, reason: "Not a team member" };
    }

    if (action === "view") {
      return { authorized: true, session, page };
    }

    if (action === "edit") {
      if (page.lockedById && page.lockedById !== session.user.id) {
        return {
          authorized: false,
          session,
          page,
          reason: "Page is locked by another user",
        };
      }
      return { authorized: true, session, page };
    }

    if (action === "delete") {
      const isOwner = membership.role === "OWNER";
      return {
        authorized: isCreator || isOwner,
        session,
        page,
        reason:
          isCreator || isOwner
            ? undefined
            : "Only the page creator or team owner can delete",
      };
    }
  }

  // Fallback: no teamId — legacy creator-only check
  return {
    authorized: isCreator,
    session,
    page,
    reason: isCreator ? undefined : "Forbidden",
  };
}

/**
 * Verify that the current user is a team OWNER.
 * Optionally scoped to a specific teamId — when provided, checks ownership
 * of that exact team instead of any team the user owns.
 */
export async function requireTeamOwner(teamId?: string): Promise<{
  authorized: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
  teamId?: string;
  reason?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { authorized: false, session: null, reason: "Unauthorized" };
  }

  const membership = await prisma.teamMember.findFirst({
    where: {
      userId: session.user.id,
      role: "OWNER",
      ...(teamId ? { teamId } : {}),
    },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    return { authorized: false, session, reason: "Not a team owner" };
  }

  return { authorized: true, session, teamId: membership.teamId };
}

/**
 * Get the user's current team ID (deterministic — earliest joined team).
 */
export async function getUserTeamId(userId: string): Promise<string | null> {
  const membership = await prisma.teamMember.findFirst({
    where: { userId },
    select: { teamId: true },
    orderBy: { createdAt: "asc" },
  });
  return membership?.teamId ?? null;
}
