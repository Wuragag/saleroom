import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CONTENT } from "@/lib/constants";
import { getUserTeamId } from "@/lib/team-auth";
import { canCreatePage } from "@/lib/plan-limits";
import { safeJson } from "@/lib/api-error";
import { withAuth } from "@/lib/api-auth";
import { generateSlug } from "@/lib/slug-utils";
import { formatFullDate } from "@/lib/format-utils";

// ---------------------------------------------------------------------------
// POST /api/pages/from-template
// Body: { templateId: string }
// Creates a new page pre-populated with the template's content and tabs.
// Increments the template's usageCount.
// Returns: { pageId: string }
// ---------------------------------------------------------------------------
export const POST = withAuth(async (request, { session }) => {
  const body = await safeJson(request) ?? {};
  const { templateId } = body as { templateId: string };

  if (!templateId) {
    return NextResponse.json({ error: "templateId is required" }, { status: 400 });
  }

  const template = await prisma.template.findUnique({ where: { id: templateId } });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  // Parse tabs from template
  const tabs = JSON.parse(template.tabs) as Array<{
    label: string;
    content: Record<string, unknown>;
  }>;

  // Build title: "Template Name — Month D, YYYY"
  const title = `${template.name} — ${formatFullDate(new Date())}`;

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

  // Create page with all tabs
  const page = await prisma.page.create({
    data: {
      title,
      slug,
      content: JSON.stringify(firstTabContent),
      userId: session.user.id,
      teamId,
      tabs: {
        create: tabs.map((tab, i) => ({
          name: tab.label,
          order: i,
          content: JSON.stringify(tab.content),
        })),
      },
    },
    include: { tabs: { orderBy: { order: "asc" } } },
  });

  // Increment usageCount
  await prisma.template.update({
    where: { id: templateId },
    data: { usageCount: { increment: 1 } },
  });

  return NextResponse.json({ pageId: page.id }, { status: 201 });
});
