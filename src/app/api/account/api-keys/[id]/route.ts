import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-error";

/** DELETE /api/account/api-keys/[id] — revoke one of the caller's own keys. */
export const DELETE = withErrorHandler(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  // Scoped to the caller so a guessed id can never revoke someone else's key.
  const result = await prisma.apiKey.deleteMany({
    where: { id, userId: session.user.id },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
});
