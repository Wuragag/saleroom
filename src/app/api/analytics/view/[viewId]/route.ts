import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { withErrorHandler } from "@/lib/api-error";

const limiter = rateLimit({ limit: 20, window: "60s" });

export const PATCH = withErrorHandler(async (
  req: Request,
  { params }: { params: Promise<{ viewId: string }> }
) => {
  const { viewId } = await params;

  // Rate limit: 20 duration updates per minute per IP
  const ip = getClientIp(req);
  const { success } = await limiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { duration } = await req.json();
  if (typeof duration !== "number") {
    return NextResponse.json(
      { error: "duration required" },
      { status: 400 }
    );
  }

  // Clamp duration to a reasonable range (0–86400 seconds = 24 hours)
  const clampedDuration = Math.max(0, Math.min(Math.round(duration), 86_400));

  // Verify the view exists before updating
  const existing = await prisma.pageView.findUnique({
    where: { id: viewId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "View not found" }, { status: 404 });
  }

  await prisma.pageView.update({
    where: { id: viewId },
    data: { duration: clampedDuration },
  });

  return NextResponse.json({ ok: true });
});
