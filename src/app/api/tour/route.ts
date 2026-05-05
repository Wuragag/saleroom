import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-auth";

export const POST = withAuth(async (_request, { session }) => {
  await prisma.user.update({
    where: { id: session.user.id },
    data: { hasSeenTour: true },
  });

  return NextResponse.json({ ok: true });
});

export const GET = withAuth(async (_request, { session }) => {
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { hasSeenTour: true },
  });

  return NextResponse.json({ hasSeenTour: user?.hasSeenTour ?? false });
});
