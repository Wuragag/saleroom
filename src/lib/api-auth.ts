import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { withErrorHandler } from "@/lib/api-error";

export type AuthedSession = Session & { user: { id: string } & Session["user"] };

type RouteParams<P> = { params: Promise<P> };

type AuthedHandler<P> = [P] extends [never]
  ? (request: Request, ctx: { session: AuthedSession }) => Promise<NextResponse>
  : (
      request: Request,
      ctx: RouteParams<P> & { session: AuthedSession }
    ) => Promise<NextResponse>;

/**
 * Higher-order wrapper that gates a route handler on a valid session and
 * folds it under `withErrorHandler` automatically. The handler receives
 * `session` (with a non-null `user.id`) on its context object.
 *
 *   export const GET = withAuth(async (request, { session }) => { ... });
 *   export const PUT = withAuth<{ id: string }>(async (req, { session, params }) => {
 *     const { id } = await params;
 *   });
 */
export function withAuth<P = never>(handler: AuthedHandler<P>) {
  return withErrorHandler(async (
    request: Request,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ctx?: any
  ) => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (handler as any)(request, { ...(ctx ?? {}), session });
  });
}
