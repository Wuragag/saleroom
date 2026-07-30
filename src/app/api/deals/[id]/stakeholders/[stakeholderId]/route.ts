import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkDealAccess } from "@/lib/deal-auth";
import { withErrorHandler, safeJson } from "@/lib/api-error";
import { cleanString } from "@/lib/validation";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function authorize(dealId: string, stakeholderId: string) {
  const access = await checkDealAccess(dealId, "edit");
  if (!access.authorized) {
    const status = !access.session ? 401 : access.reason === "Deal not found" ? 404 : 403;
    return { error: NextResponse.json({ error: access.reason }, { status }) };
  }
  const stakeholder = await prisma.dealStakeholder.findUnique({
    where: { id: stakeholderId },
  });
  if (!stakeholder || stakeholder.dealId !== dealId) {
    return {
      error: NextResponse.json({ error: "Stakeholder not found" }, { status: 404 }),
    };
  }
  return { stakeholder };
}

/** PATCH /api/deals/[id]/stakeholders/[stakeholderId] */
export const PATCH = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string; stakeholderId: string }> }
) => {
  const { id, stakeholderId } = await params;
  const auth = await authorize(id, stakeholderId);
  if (auth.error) return auth.error;

  const body =
    (await safeJson<{ name?: unknown; email?: unknown; title?: unknown }>(request)) ?? {};
  const data: { name?: string; email?: string; title?: string } = {};
  if (body.name !== undefined) {
    const name = cleanString(body.name, 120);
    if (name === null) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    data.name = name;
  }
  if (body.title !== undefined) {
    const title = cleanString(body.title, 120);
    if (title === null) {
      return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    }
    data.title = title;
  }
  if (body.email !== undefined) {
    const email = cleanString(body.email, 254)?.toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }
    data.email = email;
  }

  const updated = await prisma.dealStakeholder.update({
    where: { id: stakeholderId },
    data,
  });
  return NextResponse.json(updated);
});

/** DELETE /api/deals/[id]/stakeholders/[stakeholderId] */
export const DELETE = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string; stakeholderId: string }> }
) => {
  const { id, stakeholderId } = await params;
  const auth = await authorize(id, stakeholderId);
  if (auth.error) return auth.error;

  await prisma.dealStakeholder.delete({ where: { id: stakeholderId } });
  return new NextResponse(null, { status: 204 });
});
