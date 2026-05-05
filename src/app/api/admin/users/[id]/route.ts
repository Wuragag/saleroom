import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdminAuth } from "@/lib/admin-auth";

export const PUT = withAdminAuth<{ id: string }>(async (request, { params, session }) => {
  const { id } = await params;
  const body = await request.json();
  const { isAdmin } = body as { isAdmin: boolean };

  if (typeof isAdmin !== "boolean") {
    return NextResponse.json({ error: "isAdmin must be a boolean" }, { status: 400 });
  }

  // Prevent self-demotion
  if (!isAdmin && id === session.user.id) {
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
});
