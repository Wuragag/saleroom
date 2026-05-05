import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-auth";

export const PATCH = withAuth(async (request, { session }) => {
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
});
