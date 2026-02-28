import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      role?: string;
      onboardingCompleted?: boolean;
    };

    const updateData: Record<string, unknown> = {};
    if (body.role !== undefined) updateData.role = body.role;
    if (body.onboardingCompleted !== undefined)
      updateData.onboardingCompleted = body.onboardingCompleted;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        role: true,
        onboardingCompleted: true,
      },
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
