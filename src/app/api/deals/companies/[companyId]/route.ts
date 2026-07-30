import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getUserTeamId } from "@/lib/team-auth";
import { withErrorHandler, safeJson } from "@/lib/api-error";
import { companyScopeWhere } from "@/lib/contacts";
import { cleanString } from "@/lib/validation";

async function requireCompany(companyId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" as const };
  const userId = session.user.id;
  const teamId = await getUserTeamId(userId);
  const company = await prisma.company.findFirst({
    where: { id: companyId, ...companyScopeWhere({ teamId, userId }) },
    select: { id: true },
  });
  if (!company) return { error: "Not found" as const };
  return { companyId: company.id };
}

/** PATCH /api/deals/companies/[companyId] — rename. */
export const PATCH = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ companyId: string }> }
) => {
  const { companyId } = await params;
  const found = await requireCompany(companyId);
  if (found.error) {
    return NextResponse.json(
      { error: found.error },
      { status: found.error === "Unauthorized" ? 401 : 404 }
    );
  }

  const body = (await safeJson<{ name?: unknown }>(request)) ?? {};
  const name = cleanString(body.name, 200);
  if (!name) {
    return NextResponse.json({ error: "Company name is required" }, { status: 400 });
  }

  const updated = await prisma.company.update({
    where: { id: found.companyId },
    data: { name },
  });
  return NextResponse.json(updated);
});

/**
 * DELETE /api/deals/companies/[companyId] — deals and contacts survive with
 * their company cleared (FK SetNull).
 */
export const DELETE = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ companyId: string }> }
) => {
  const { companyId } = await params;
  const found = await requireCompany(companyId);
  if (found.error) {
    return NextResponse.json(
      { error: found.error },
      { status: found.error === "Unauthorized" ? 401 : 404 }
    );
  }
  await prisma.company.delete({ where: { id: found.companyId } });
  return new NextResponse(null, { status: 204 });
});
