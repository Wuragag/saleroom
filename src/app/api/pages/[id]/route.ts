import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = await prisma.page.findUnique({
    where: { id },
    include: { tabs: { orderBy: { order: "asc" } } },
  });

  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  if (page.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(page);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existingPage = await prisma.page.findUnique({
    where: { id },
  });
  if (!existingPage) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }
  if (existingPage.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  const updateData: Record<string, unknown> = {};

  if (body.title !== undefined) updateData.title = body.title;
  if (body.content !== undefined) updateData.content = body.content;
  if (body.published !== undefined) updateData.published = body.published;
  if (body.slug !== undefined) updateData.slug = body.slug;
  if (body.font !== undefined) updateData.font = body.font;
  if (body.accentColor !== undefined) updateData.accentColor = body.accentColor;
  if (body.layoutWidth !== undefined) updateData.layoutWidth = body.layoutWidth;
  if (body.background !== undefined) updateData.background = body.background;
  if (body.tabPlacement !== undefined) updateData.tabPlacement = body.tabPlacement;
  if (body.logoUrl !== undefined) updateData.logoUrl = body.logoUrl;
  if (body.links !== undefined) updateData.links = body.links;
  if (body.password !== undefined) {
    updateData.password = body.password
      ? await bcrypt.hash(body.password, 10)
      : null;
  }
  if (body.tags !== undefined) updateData.tags = body.tags;

  const page = await prisma.page.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(page);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existingPage = await prisma.page.findUnique({
    where: { id },
  });
  if (!existingPage) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }
  if (existingPage.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.page.delete({
    where: { id },
  });

  return new NextResponse(null, { status: 204 });
}
