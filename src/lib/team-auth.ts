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

/** Result of the session-free ACL check (`checkPageAccessFor`). */
export interface PageAccessResult {
  authorized: boolean;
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
  const result = await checkPageAccessFor(session.user.id, pageId, action);
  return { ...result, session };
}

/**
 * The same ACL for an explicit principal — used by callers that authenticate
 * outside the NextAuth session (the MCP server's API keys). `checkPageAccess`
 * is a thin wrapper over this, so the rules can never diverge.
 */
export async function checkPageAccessFor(
  userId: string,
  pageId: string,
  action: PagePermission
): Promise<PageAccessResult> {
  const page = await prisma.page.findUnique({
    where: { id: pageId },
  });

  if (!page) {
    return { authorized: false, reason: "Page not found" };
  }

  return evaluatePageAccess(userId, page, action);
}

/** The page fields the ACL rules read — callers that already hold them can skip the refetch. */
export type PageAccessInput = {
  userId: string;
  teamId: string | null;
  visibility: "TEAM" | "PRIVATE";
  lockedById: string | null;
};

/**
 * The page ACL rules themselves, for a page the caller has already loaded.
 * `checkPageAccessFor` delegates here — this is the single implementation.
 */
export async function evaluatePageAccess<P extends PageAccessInput>(
  userId: string,
  page: P,
  action: PagePermission
): Promise<PageAccessResult> {
  const isCreator = page.userId === userId;

  // Private page: only creator has any access
  if (page.visibility === "PRIVATE") {
    return {
      authorized: isCreator,
      page,
      reason: isCreator ? undefined : "This is a private page",
    };
  }

  // Team page: check team membership
  if (page.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId: page.teamId,
        },
      },
    });

    if (!membership) {
      return { authorized: false, page, reason: "Not a team member" };
    }

    if (action === "view") {
      return { authorized: true, page };
    }

    if (action === "edit") {
      if (page.lockedById && page.lockedById !== userId) {
        return {
          authorized: false,
          page,
          reason: "Page is locked by another user",
        };
      }
      return { authorized: true, page };
    }

    if (action === "delete") {
      const isOwner = membership.role === "OWNER";
      return {
        authorized: isCreator || isOwner,
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
