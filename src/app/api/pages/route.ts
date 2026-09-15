import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getUserTeamId } from "@/lib/team-auth";
import { createPageWithTabs, SlugCollisionError } from "@/lib/page-create";
import { withErrorHandler, safeJson } from "@/lib/api-error";

export const POST = withErrorHandler(async (request: Request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await safeJson<{ title?: string }>(request) ?? {};
  const title = body.title || "Untitled Page";

  // Slug + brand kit + atomic plan-limit enforcement live in page-create.ts
  // (PlanLimitError → 403 PLAN_LIMIT via withErrorHandler).
  try {
    const page = await createPageWithTabs({ userId: session.user.id, title });
    return NextResponse.json(page, { status: 201 });
  } catch (err) {
    if (err instanceof SlugCollisionError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
});

export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
