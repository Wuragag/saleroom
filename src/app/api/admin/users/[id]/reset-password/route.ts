import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { withAdminAuth } from "@/lib/admin-auth";

export const POST = withAdminAuth<{ id: string }>(async (request, { params }) => {
  const { id } = await params;
  const body = await request.json();
  const { password } = body as { password: string };

  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id },
    data: { password: hashed },
  });

  return NextResponse.json({ ok: true });
});
