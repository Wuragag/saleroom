/**
 * GET /api/activity?limit=15
 *
 * Workspace-level "Recent Activity" feed for the dashboard drawer. The merge
 * itself lives in src/lib/activity-queries.ts (shared with the MCP server).
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserTeamId } from "@/lib/team-auth";
import { listWorkspaceActivity } from "@/lib/activity-queries";
import { withErrorHandler } from "@/lib/api-error";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 15), 50);
  const teamId = await getUserTeamId(userId);
  const items = await listWorkspaceActivity(userId, teamId, limit);

  return NextResponse.json({ items });
});
