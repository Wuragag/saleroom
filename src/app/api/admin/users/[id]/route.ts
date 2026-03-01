import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { isAdmin } = body as { isAdmin: boolean };

  if (typeof isAdmin !== "boolean") {
    return NextResponse.json({ error: "isAdmin must be a boolean" }, { status: 400 });
  }

  // Prevent self-demotion
  if (!isAdmin && id === auth.session?.user?.id) {
    return NextResponse.json(
      { error: "You cannot remove your own admin access" },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id },
    data: { isAdmin },
    select: { id: true, isAdmin: true },
  });

  return NextResponse.json(user);
}
