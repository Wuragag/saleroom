import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CONTENT, DEFAULT_TAB_NAME } from "@/lib/constants";
import { auth } from "@/auth";
import { getUserTeamId } from "@/lib/team-auth";
import { assertCanCreatePageTx, withResourceLock, pageLockKey } from "@/lib/plan-limits";
import { withErrorHandler, safeJson } from "@/lib/api-error";
import slugify from "slugify";

function generateSlug(title: string): string {
  const base = slugify(title, { lower: true, strict: true });
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

export const POST = withErrorHandler(async (request: Request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  // Atomic plan-limit enforcement + create. The advisory lock serializes
  // concurrent creates for this team/user so the count can't be raced
  // (PlanLimitError → 403 PLAN_LIMIT via withErrorHandler).
  const page = await withResourceLock(
    pageLockKey(teamId, session.user.id),
    async (tx) => {
      await assertCanCreatePageTx(tx, teamId, session.user.id);
      return tx.page.create({
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
    }
  );

  return NextResponse.json(page, { status: 201 });
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
