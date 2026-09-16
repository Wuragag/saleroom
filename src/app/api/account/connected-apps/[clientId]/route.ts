import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { withErrorHandler } from "@/lib/api-error";
import { disconnectApp } from "@/lib/oauth-server";

/** DELETE /api/account/connected-apps/[clientId] — revoke every token granted to that app. */
export const DELETE = withErrorHandler(async (
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { clientId } = await params;
  const revoked = await disconnectApp(session.user.id, clientId);
  if (revoked === 0) {
    return NextResponse.json({ error: "No active connection for this app" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
});
