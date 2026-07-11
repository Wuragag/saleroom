import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CONTENT } from "@/lib/constants";
import { brandDefaultPageStyle, getTeamBrandKit } from "@/lib/brand-kit";
import { auth } from "@/auth";
import { getUserTeamId } from "@/lib/team-auth";
import {
  assertCanCreatePageTx,
  assertCanCreateTabsTx,
  withResourceLock,
  pageLockKey,
} from "@/lib/plan-limits";
import { withErrorHandler, safeJson } from "@/lib/api-error";
import slugify from "slugify";

function generateSlug(name: string): string {
  const base = slugify(name, { lower: true, strict: true });
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

// ---------------------------------------------------------------------------
// POST /api/pages/from-template
// Body: { templateId: string }
// Creates a new page pre-populated with the template's content and tabs.
// Increments the template's usageCount.
// Returns: { pageId: string }
// ---------------------------------------------------------------------------
export const POST = withErrorHandler(async (request: Request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await safeJson(request) ?? {};
  const { templateId } = body as { templateId: string };

  if (!templateId) {
    return NextResponse.json({ error: "templateId is required" }, { status: 400 });
  }

  // Assign to user's team (also used to authorize template access below)
  const teamId = await getUserTeamId(session.user.id);

  const template = await prisma.template.findUnique({ where: { id: templateId } });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  // Authorize: only global/default templates or templates owned by the caller's
  // team may be instantiated. Prevents reading another tenant's saved content.
  if (!template.isDefault && (!teamId || template.teamId !== teamId)) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  // Parse tabs from template
  const tabs = JSON.parse(template.tabs) as Array<{
    label: string;
    content: Record<string, unknown>;
  }>;

  // Build title: "Template Name — Month D, YYYY"
  const title = `${template.name} — ${new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;

  // Generate unique slug
  let slug = generateSlug(template.name);
  let attempts = 0;
  while (attempts < 5) {
    const existing = await prisma.page.findUnique({ where: { slug } });
    if (!existing) break;
    slug = generateSlug(template.name);
    attempts++;
  }

  if (attempts >= 5) {
    return NextResponse.json(
      { error: "Could not generate a unique URL. Please try again." },
      { status: 409 }
    );
  }

  // First tab's content becomes the page's top-level content
  const firstTabContent = tabs[0]?.content ?? DEFAULT_CONTENT;

  // Atomic plan-limit enforcement + create. Enforces both the page cap and the
  // per-page tab cap (a FREE plan can't instantiate a template with more tabs
  // than its limit) inside one advisory-locked transaction.
  // New pages start from the team's brand kit, falling back to the editorial
  // baseline (DB column defaults predate the redesign).
  const style = brandDefaultPageStyle(await getTeamBrandKit(teamId));

  const page = await withResourceLock(
    pageLockKey(teamId, session.user.id),
    async (tx) => {
      await assertCanCreatePageTx(tx, teamId, session.user.id);
      const created = await tx.page.create({
        data: {
          title,
          slug,
          content: JSON.stringify(firstTabContent),
          userId: session.user.id,
          teamId,
          font: style.font,
          headingFont: style.headingFont,
          accentColor: style.accentColor,
          background: style.background,
          layoutWidth: style.layoutWidth,
          tabPlacement: style.tabPlacement,
          themeRadius: style.themeRadius,
          themeDepth: style.themeDepth,
          logoUrl: style.logoUrl,
        },
      });
      await assertCanCreateTabsTx(tx, created.id, teamId, tabs.length || 1);
      if (tabs.length > 0) {
        await tx.tab.createMany({
          data: tabs.map((tab, i) => ({
            name: tab.label,
            order: i,
            content: JSON.stringify(tab.content),
            pageId: created.id,
          })),
        });
      }
      return created;
    }
  );

  // Increment usageCount
  await prisma.template.update({
    where: { id: templateId },
    data: { usageCount: { increment: 1 } },
  });

  return NextResponse.json({ pageId: page.id }, { status: 201 });
});
