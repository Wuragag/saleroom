import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getUserTeamId } from "@/lib/team-auth";
import { withErrorHandler, safeJson } from "@/lib/api-error";
import { listContacts } from "@/lib/contact-queries";
import { resolveCompanyInput } from "@/lib/contacts";
import { cleanString } from "@/lib/validation";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** GET /api/deals/contacts — the scope's contact book with warmth. */
export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const teamId = await getUserTeamId(session.user.id);
  return NextResponse.json(await listContacts(session.user.id, teamId));
});

/** POST /api/deals/contacts — add a contact by hand. */
export const POST = withErrorHandler(async (request: Request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const teamId = await getUserTeamId(userId);

  const body =
    (await safeJson<{
      email?: unknown;
      name?: unknown;
      title?: unknown;
      companyName?: unknown;
      companyId?: unknown;
    }>(request)) ?? {};

  const email = cleanString(body.email, 254)?.toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  const name = body.name === undefined ? "" : cleanString(body.name, 120);
  const title = body.title === undefined ? "" : cleanString(body.title, 120);
  if (name === null || title === null) {
    return NextResponse.json({ error: "Invalid contact" }, { status: 400 });
  }

  const companyId = await resolveCompanyInput(
    { teamId, userId },
    body.companyId,
    body.companyName
  );
  if (companyId === false) {
    return NextResponse.json({ error: "Invalid company" }, { status: 400 });
  }

  // Duplicate email per scope → P2002 → 409 via withErrorHandler.
  const contact = await prisma.contact.create({
    data: {
      email,
      name,
      title,
      companyId,
      teamId: teamId ?? null,
      userId: teamId ? null : userId,
    },
    include: { company: { select: { id: true, name: true } } },
  });

  return NextResponse.json(contact, { status: 201 });
});
