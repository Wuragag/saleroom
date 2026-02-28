import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CONTENT } from "@/lib/constants";
import { auth } from "@/auth";
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
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
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

  // First tab's content becomes the page's top-level content
  const firstTabContent = tabs[0]?.content ?? DEFAULT_CONTENT;

  // Create page with all tabs
  const page = await prisma.page.create({
    data: {
      title,
      slug,
      content: JSON.stringify(firstTabContent),
      userId: session.user.id,
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
}
