import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

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
