import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { withErrorHandler } from "@/lib/api-error";
import type { AuthedSession } from "@/lib/api-auth";

interface AdminAuthResult {
  authorized: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session?: any;
  reason?: string;
}

/**
 * Verify that the current user is an admin.
 * Always re-reads isAdmin from DB (not JWT) so the check can't be spoofed
 * by a stale token.
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { authorized: false, reason: "unauthenticated" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });

  if (!user?.isAdmin) {
    return { authorized: false, reason: "forbidden" };
  }

  return { authorized: true, session };
}

type RouteParams<P> = { params: Promise<P> };

type AdminHandler<P> = [P] extends [never]
  ? (request: Request, ctx: { session: AuthedSession }) => Promise<NextResponse>
  : (
      request: Request,
      ctx: RouteParams<P> & { session: AuthedSession }
    ) => Promise<NextResponse>;

/**
 * Higher-order wrapper that gates a route on admin status and folds it under
 * `withErrorHandler`. The handler receives the validated session.
 */
export function withAdminAuth<P = never>(handler: AdminHandler<P>) {
  return withErrorHandler(async (
    request: Request,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ctx?: any
  ) => {
    const result = await requireAdmin();
    if (!result.authorized) {
      const status = result.reason === "unauthenticated" ? 401 : 403;
      const error = result.reason === "unauthenticated" ? "Unauthorized" : "Forbidden";
      return NextResponse.json({ error }, { status });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (handler as any)(request, { ...(ctx ?? {}), session: result.session });
  });
}
