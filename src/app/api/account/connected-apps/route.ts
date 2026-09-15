import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { withErrorHandler } from "@/lib/api-error";
import { listConnectedApps } from "@/lib/oauth-server";

/** GET /api/account/connected-apps — OAuth clients holding a live grant. */
export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const apps = await listConnectedApps(session.user.id);
  return NextResponse.json({ apps });
});
