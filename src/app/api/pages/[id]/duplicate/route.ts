import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import slugify from "slugify";

function generateSlug(title: string): string {
  const base = slugify(title, { lower: true, strict: true });
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch original page with all its tabs
  const original = await prisma.page.findUnique({
    where: { id },
    include: { tabs: { orderBy: { order: "asc" } } },
  });

  if (!original) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  if (original.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  // Create duplicated page + tabs in a transaction
  const copy = await prisma.$transaction(async (tx) => {
    const newPage = await tx.page.create({
      data: {
        title: copyTitle,
        slug,
        content: original.content,
        published: false,           // always start as draft
        userId: session.user.id,
        font: original.font,
        accentColor: original.accentColor,
        layoutWidth: original.layoutWidth,
        background: original.background,
        tabPlacement: original.tabPlacement,
        logoUrl: original.logoUrl,
        links: original.links,
        password: original.password,
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
}
