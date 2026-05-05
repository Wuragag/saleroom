import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CONTENT, DEFAULT_TAB_NAME } from "@/lib/constants";
import { getUserTeamId } from "@/lib/team-auth";
import { canCreatePage } from "@/lib/plan-limits";
import { safeJson } from "@/lib/api-error";
import { withAuth } from "@/lib/api-auth";
import { generateSlug } from "@/lib/slug-utils";

export const POST = withAuth(async (request, { session }) => {
  const body = await safeJson<{ title?: string }>(request) ?? {};
  const title = body.title || "Untitled Page";

  let slug = generateSlug(title);

  // Retry if slug collision
  let attempts = 0;
  while (attempts < 5) {
    const existing = await prisma.page.findUnique({ where: { slug } });
    if (!existing) break;
    slug = generateSlug(title);
    attempts++;
  }

  if (attempts >= 5) {
    return NextResponse.json(
      { error: "Could not generate a unique URL. Please try a different title." },
      { status: 409 }
    );
  }

  // Assign to user's team
  const teamId = await getUserTeamId(session.user.id);

  // ── Plan limit check ──
  if (teamId) {
    const limitCheck = await canCreatePage(teamId);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.reason, code: "PLAN_LIMIT", current: limitCheck.current, limit: limitCheck.limit },
        { status: 403 }
      );
    }
  }

  const page = await prisma.page.create({
    data: {
      title,
      slug,
      content: JSON.stringify(DEFAULT_CONTENT),
      userId: session.user.id,
      teamId,
      tabs: {
        create: {
          name: DEFAULT_TAB_NAME,
          order: 0,
          content: JSON.stringify(DEFAULT_CONTENT),
        },
      },
    },
    include: { tabs: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json(page, { status: 201 });
});

export const GET = withAuth(async (_request, { session }) => {
  const teamId = await getUserTeamId(session.user.id);

  // Show team pages (TEAM visibility) + user's own private pages
  const pages = await prisma.page.findMany({
    where: teamId
      ? {
          OR: [
            { teamId, visibility: "TEAM" },
            { userId: session.user.id, visibility: "PRIVATE" },
          ],
        }
      : { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { tabs: { orderBy: { order: "asc" } } },
  });

  // Strip password hashes — clients only need to know if one is set
  const safePages = pages.map(({ password, ...rest }) => ({
    ...rest,
    hasPassword: !!password,
  }));

  return NextResponse.json(safePages);
});
