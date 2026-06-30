import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getUserTeamId } from "@/lib/team-auth";
import { withErrorHandler, safeJson } from "@/lib/api-error";

// ---------------------------------------------------------------------------
// GET /api/templates
// Returns all templates ordered by usageCount desc.
// Optionally filter by ?category=post-call
// ---------------------------------------------------------------------------
export const GET = withErrorHandler(async (request: Request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  // Only return global/default templates plus templates owned by the caller's
  // team. User-saved templates must never leak across tenants.
  const teamId = await getUserTeamId(session.user.id);
  const scope = teamId
    ? { OR: [{ isDefault: true }, { teamId }] }
    : { isDefault: true };

  const templates = await prisma.template.findMany({
    where: category ? { AND: [{ category }, scope] } : scope,
    orderBy: { usageCount: "desc" },
  });

  return NextResponse.json(templates);
});

// ---------------------------------------------------------------------------
// POST /api/templates
// Body: { name, description, category, pageId }
// Fetches page + tabs, creates a Template record, returns { id }
// ---------------------------------------------------------------------------
export const POST = withErrorHandler(async (request: Request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await safeJson(request) ?? {};
  const { name, description, category, pageId } = body as {
    name: string;
    description: string;
    category: string;
    pageId: string;
  };

  if (!name || !category || !pageId) {
    return NextResponse.json(
      { error: "name, category, and pageId are required" },
      { status: 400 }
    );
  }

  // A saved template is owned by the creator's team so it stays private to it.
  const teamId = await getUserTeamId(session.user.id);
  if (!teamId) {
    return NextResponse.json(
      { error: "You need a team to save templates." },
      { status: 400 }
    );
  }

  // Fetch page with tabs (must belong to current user)
  const page = await prisma.page.findFirst({
    where: { id: pageId, userId: session.user.id },
    include: { tabs: { orderBy: { order: "asc" } } },
  });

  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  // Build tabs array — each tab maps to { label, content }
  const tabs = page.tabs.map((tab) => ({
    label: tab.name,
    content: JSON.parse(tab.content),
  }));

  const template = await prisma.template.create({
    data: {
      name,
      description: description || "",
      category,
      icon: "📄",
      tabs: JSON.stringify(tabs),
      isDefault: false,
      usageCount: 0,
      teamId,
    },
  });

  return NextResponse.json({ id: template.id }, { status: 201 });
});
