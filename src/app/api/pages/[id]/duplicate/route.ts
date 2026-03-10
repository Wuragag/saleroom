import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPageAccess, getUserTeamId } from "@/lib/team-auth";
import { canCreatePage } from "@/lib/plan-limits";
import { withErrorHandler } from "@/lib/api-error";
import slugify from "slugify";

function generateSlug(title: string): string {
  const base = slugify(title, { lower: true, strict: true });
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

export const POST = withErrorHandler(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const access = await checkPageAccess(id, "view");

  if (!access.authorized) {
    const status = !access.session ? 401 : access.reason === "Page not found" ? 404 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  // Fetch original page with all its tabs
  const original = await prisma.page.findUnique({
    where: { id },
    include: { tabs: { orderBy: { order: "asc" } } },
  });

  if (!original) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  // Generate a unique slug for the copy
  const copyTitle = `${original.title} (Copy)`;
  let slug = generateSlug(copyTitle);
  let attempts = 0;
  while (attempts < 5) {
    const existing = await prisma.page.findUnique({ where: { slug } });
    if (!existing) break;
    slug = generateSlug(copyTitle);
    attempts++;
  }

  if (attempts >= 5) {
    return NextResponse.json(
      { error: "Could not generate a unique URL. Please try again." },
      { status: 409 }
    );
  }

  // Assign to the duplicating user's team
  const teamId = await getUserTeamId(access.session.user.id);

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

  // Create duplicated page + tabs in a transaction
  const copy = await prisma.$transaction(async (tx) => {
    const newPage = await tx.page.create({
      data: {
        title: copyTitle,
        slug,
        content: original.content,
        published: false,
        userId: access.session.user.id,
        teamId,
        font: original.font,
        accentColor: original.accentColor,
        layoutWidth: original.layoutWidth,
        background: original.background,
        tabPlacement: original.tabPlacement,
        logoUrl: original.logoUrl,
        links: original.links,
        // Intentionally NOT copying password — duplicates start unprotected
      },
    });

    // Duplicate all tabs
    if (original.tabs.length > 0) {
      await tx.tab.createMany({
        data: original.tabs.map((tab) => ({
          name: tab.name,
          order: tab.order,
          content: tab.content,
          pageId: newPage.id,
        })),
      });
    }

    return tx.page.findUnique({
      where: { id: newPage.id },
      include: { tabs: { orderBy: { order: "asc" } } },
    });
  });

  return NextResponse.json(copy, { status: 201 });
});
