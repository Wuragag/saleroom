import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getUserTeamId } from "@/lib/team-auth";
import {
  createPageWithTabs,
  templatePageTitle,
  SlugCollisionError,
} from "@/lib/page-create";
import { withErrorHandler, safeJson } from "@/lib/api-error";

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

  // Atomic plan-limit enforcement (page cap + per-page tab cap — a FREE plan
  // can't instantiate a template with more tabs than its limit) + brand kit
  // styling, all inside page-create.ts.
  let page;
  try {
    page = await createPageWithTabs({
      userId: session.user.id,
      title: templatePageTitle(template.name),
      slugSeed: template.name,
      tabs: tabs.map((tab) => ({ name: tab.label, content: tab.content })),
    });
  } catch (err) {
    if (err instanceof SlugCollisionError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }

  // Increment usageCount
  await prisma.template.update({
    where: { id: templateId },
    data: { usageCount: { increment: 1 } },
  });

  return NextResponse.json({ pageId: page.id }, { status: 201 });
});
