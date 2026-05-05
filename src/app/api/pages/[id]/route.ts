import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkPageAccess } from "@/lib/team-auth";
import { canSetPassword } from "@/lib/plan-limits";
import { withErrorHandler } from "@/lib/api-error";
import { generateSlug } from "@/lib/slug-utils";
import bcrypt from "bcryptjs";

export const GET = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const access = await checkPageAccess(id, "view");

  if (!access.authorized) {
    const status = !access.session ? 401 : access.reason === "Page not found" ? 404 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  const page = await prisma.page.findUnique({
    where: { id },
    include: { tabs: { orderBy: { order: "asc" } } },
  });

  if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });

  // Strip password hash from response — clients only need to know if one is set
  const { password: _pw, ...safePageData } = page;
  return NextResponse.json({ ...safePageData, hasPassword: !!_pw });
});

export const PUT = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const body = await request.json();

  // Visibility change: only the page creator can change it
  if (body.visibility !== undefined) {
    const viewAccess = await checkPageAccess(id, "view");
    if (!viewAccess.authorized) {
      const status = !viewAccess.session ? 401 : viewAccess.reason === "Page not found" ? 404 : 403;
      return NextResponse.json({ error: viewAccess.reason }, { status });
    }
    if (viewAccess.page?.userId !== viewAccess.session?.user?.id) {
      return NextResponse.json(
        { error: "Only the page creator can change visibility" },
        { status: 403 }
      );
    }
  }

  const access = await checkPageAccess(id, "edit");
  if (!access.authorized) {
    const status = !access.session ? 401 : access.reason === "Page not found" ? 404 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  const updateData: Record<string, unknown> = {};

  if (body.title !== undefined) {
    updateData.title = body.title;

    // Auto-update slug when title changes, unless the caller is explicitly
    // setting a custom slug in the same request.
    if (body.slug === undefined && access.page) {
      const currentTitle = access.page.title ?? "";
      const newTitle = body.title as string;
      if (newTitle && newTitle !== currentTitle) {
        let newSlug = generateSlug(newTitle);
        // Retry if slug collision (up to 5 attempts)
        let attempts = 0;
        while (attempts < 5) {
          const existing = await prisma.page.findUnique({ where: { slug: newSlug } });
          if (!existing || existing.id === id) break;
          newSlug = generateSlug(newTitle);
          attempts++;
        }
        if (attempts < 5) {
          updateData.slug = newSlug;
        }
      }
    }
  }
  if (body.content !== undefined) updateData.content = body.content;
  if (body.published !== undefined) updateData.published = body.published;
  if (body.slug !== undefined) updateData.slug = body.slug;
  if (body.font !== undefined) updateData.font = body.font;
  if (body.accentColor !== undefined) updateData.accentColor = body.accentColor;
  if (body.layoutWidth !== undefined) updateData.layoutWidth = body.layoutWidth;
  if (body.background !== undefined) updateData.background = body.background;
  if (body.tabPlacement !== undefined) updateData.tabPlacement = body.tabPlacement;
  if (body.logoUrl !== undefined) updateData.logoUrl = body.logoUrl;
  if (body.coverImage !== undefined) updateData.coverImage = body.coverImage;
  if (body.links !== undefined) updateData.links = body.links;
  if (body.password !== undefined) {
    // ── Plan limit check: password protection ──
    if (body.password && access.page?.teamId) {
      const pwCheck = await canSetPassword(access.page.teamId);
      if (!pwCheck.allowed) {
        return NextResponse.json(
          { error: pwCheck.reason, code: "PLAN_LIMIT" },
          { status: 403 }
        );
      }
    }
    updateData.password = body.password
      ? await bcrypt.hash(body.password, 10)
      : null;
  }
  if (body.tags !== undefined) updateData.tags = body.tags;
  if (body.visibility !== undefined) updateData.visibility = body.visibility;
  if (body.requireEmail !== undefined) updateData.requireEmail = !!body.requireEmail;

  const page = await prisma.page.update({
    where: { id },
    data: updateData,
  });

  // Bust ISR cache so buyers see the latest version immediately
  if (page.slug) {
    revalidatePath(`/p/${page.slug}`);
  }

  // Strip password hash from response
  const { password: _pw, ...safePageData } = page;
  return NextResponse.json({ ...safePageData, hasPassword: !!_pw });
});

export const DELETE = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const access = await checkPageAccess(id, "delete");

  if (!access.authorized) {
    const status = !access.session ? 401 : access.reason === "Page not found" ? 404 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  await prisma.page.delete({
    where: { id },
  });

  return new NextResponse(null, { status: 204 });
});
