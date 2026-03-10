import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { withErrorHandler } from "@/lib/api-error";

const limiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 });

export const POST = withErrorHandler(async (req: Request) => {
  // Rate limit: 30 events per minute per IP
  const ip = getClientIp(req);
  const { success } = limiter.check(ip, 30);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { pageId, type, meta = "" } = await req.json();
  if (!pageId || !type) {
    return NextResponse.json(
      { error: "pageId and type required" },
      { status: 400 }
    );
  }

  // Validate that the page actually exists (prevent phantom data)
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: { id: true },
  });
  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  // Restrict allowed event types
  const allowedTypes = ["link_click", "form_submission", "cta_click"];
  if (!allowedTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
  }

  // Cap meta length to prevent oversized payloads
  const safeMeta = typeof meta === "string" ? meta.slice(0, 2048) : "";

  await prisma.pageEvent.create({
    data: { pageId, type, meta: safeMeta },
  });
  return NextResponse.json({ ok: true });
});
