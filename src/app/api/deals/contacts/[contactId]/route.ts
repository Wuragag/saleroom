import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getUserTeamId } from "@/lib/team-auth";
import { withErrorHandler, safeJson } from "@/lib/api-error";
import { contactScopeWhere, resolveCompanyInput } from "@/lib/contacts";
import { cleanString } from "@/lib/validation";
import type { Prisma } from "@/generated/prisma";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requireContact(contactId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" as const };
  const userId = session.user.id;
  const teamId = await getUserTeamId(userId);
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, ...contactScopeWhere({ teamId, userId }) },
    select: { id: true },
  });
  if (!contact) return { error: "Not found" as const };
  return { contactId: contact.id, scope: { teamId, userId } };
}

/** PATCH /api/deals/contacts/[contactId] */
export const PATCH = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ contactId: string }> }
) => {
  const { contactId } = await params;
  const found = await requireContact(contactId);
  if (found.error) {
    return NextResponse.json(
      { error: found.error },
      { status: found.error === "Unauthorized" ? 401 : 404 }
    );
  }

  const body =
    (await safeJson<{
      email?: unknown;
      name?: unknown;
      title?: unknown;
      companyId?: unknown;
      companyName?: unknown;
    }>(request)) ?? {};
  const data: Prisma.ContactUpdateInput = {};

  if (body.email !== undefined) {
    const email = cleanString(body.email, 254)?.toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }
    data.email = email;
  }
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
  if (body.companyId !== undefined || body.companyName !== undefined) {
    const resolved = await resolveCompanyInput(
      found.scope,
      body.companyId,
      body.companyName
    );
    if (resolved === false) {
      return NextResponse.json({ error: "Invalid company" }, { status: 400 });
    }
    data.company = resolved ? { connect: { id: resolved } } : { disconnect: true };
  }

  const updated = await prisma.contact.update({
    where: { id: found.contactId },
    data,
    include: { company: { select: { id: true, name: true } } },
  });
  return NextResponse.json(updated);
});

/**
 * DELETE /api/deals/contacts/[contactId] — removes the canonical row only.
 * Room contacts and buyer tracking data are untouched.
 */
export const DELETE = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ contactId: string }> }
) => {
  const { contactId } = await params;
  const found = await requireContact(contactId);
  if (found.error) {
    return NextResponse.json(
      { error: found.error },
      { status: found.error === "Unauthorized" ? 401 : 404 }
    );
  }
  await prisma.contact.delete({ where: { id: found.contactId } });
  return new NextResponse(null, { status: 204 });
});
