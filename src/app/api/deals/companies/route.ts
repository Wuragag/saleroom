import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getUserTeamId } from "@/lib/team-auth";
import { withErrorHandler, safeJson } from "@/lib/api-error";
import { listCompanies } from "@/lib/contact-queries";
import { cleanString } from "@/lib/validation";

/** GET /api/deals/companies — the scope's companies with deal/contact rollups. */
export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const teamId = await getUserTeamId(session.user.id);
  return NextResponse.json(await listCompanies(session.user.id, teamId));
});

/** POST /api/deals/companies — add a company by hand. */
export const POST = withErrorHandler(async (request: Request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const teamId = await getUserTeamId(userId);

  const body = (await safeJson<{ name?: unknown }>(request)) ?? {};
  const name = cleanString(body.name, 200);
  if (!name) {
    return NextResponse.json({ error: "Company name is required" }, { status: 400 });
  }

  // Duplicate name per scope → P2002 → 409 via withErrorHandler.
  const company = await prisma.company.create({
    data: { name, teamId: teamId ?? null, userId: teamId ? null : userId },
  });
  return NextResponse.json(company, { status: 201 });
});
