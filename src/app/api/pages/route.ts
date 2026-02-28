import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CONTENT, DEFAULT_TAB_NAME } from "@/lib/constants";
import { auth } from "@/auth";
import slugify from "slugify";

function generateSlug(title: string): string {
  const base = slugify(title, { lower: true, strict: true });
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
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

  const page = await prisma.page.create({
    data: {
      title,
      slug,
      content: JSON.stringify(DEFAULT_CONTENT),
      userId: session.user.id,
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

  return NextResponse.json(page, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pages = await prisma.page.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { tabs: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json(pages);
}
