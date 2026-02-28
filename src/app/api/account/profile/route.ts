import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, lastName: true, email: true, avatarUrl: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, lastName, email } = (await request.json()) as {
      name?: string;
      lastName?: string;
      email?: string;
    };

    const updateData: Record<string, string> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();

    if (email !== undefined) {
      const trimmed = email.trim().toLowerCase();
      if (trimmed !== session.user.email) {
        const existing = await prisma.user.findUnique({
          where: { email: trimmed },
        });
        if (existing) {
          return NextResponse.json(
            { error: "An account with this email already exists" },
            { status: 409 }
          );
        }
      }
      updateData.email = trimmed;
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: { name: true, lastName: true, email: true, avatarUrl: true },
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
