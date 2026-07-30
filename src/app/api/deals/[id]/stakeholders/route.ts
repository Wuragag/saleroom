import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkDealAccess } from "@/lib/deal-auth";
import { withErrorHandler, safeJson } from "@/lib/api-error";
import { cleanString } from "@/lib/validation";
import { upsertContactFromActivity } from "@/lib/contacts";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** POST /api/deals/[id]/stakeholders — add a buyer-side stakeholder. */
export const POST = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const access = await checkDealAccess(id, "edit");
  if (!access.authorized) {
    const status = !access.session ? 401 : access.reason === "Deal not found" ? 404 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  const body =
    (await safeJson<{ name?: unknown; email?: unknown; title?: unknown }>(request)) ?? {};
  const email = cleanString(body.email, 254)?.toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  const name = body.name === undefined ? "" : cleanString(body.name, 120);
  const title = body.title === undefined ? "" : cleanString(body.title, 120);
  if (name === null || title === null) {
    return NextResponse.json({ error: "Invalid stakeholder" }, { status: 400 });
  }

  // Duplicate (dealId, email) → P2002 → 409 via withErrorHandler.
  const stakeholder = await prisma.dealStakeholder.create({
    data: { dealId: id, email, name, title },
  });

  // A stakeholder is a capture moment — mirror into the canonical Contacts
  // book, linked to the deal's company (fire-safe).
  await upsertContactFromActivity(
    { teamId: access.deal.teamId, userId: access.deal.ownerId },
    { email, name, title, companyId: access.deal.companyId }
  );

  return NextResponse.json(stakeholder, { status: 201 });
});
