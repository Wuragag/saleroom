import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdminAuth } from "@/lib/admin-auth";
import { createImpersonateToken } from "@/lib/impersonation";

export const POST = withAdminAuth<{ userId: string }>(async (_req, { params, session }) => {
  const { userId } = await params;

  // Prevent impersonating yourself
  if (userId === session.user.id) {
    return NextResponse.json(
      { error: "Cannot impersonate yourself" },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });

  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const token = createImpersonateToken(session.user.id, userId);
  return NextResponse.json({ token });
});
