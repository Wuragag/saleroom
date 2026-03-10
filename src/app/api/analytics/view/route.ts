import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { withErrorHandler } from "@/lib/api-error";

const limiter = rateLimit({ limit: 20, window: "60s" });

export const POST = withErrorHandler(async (req: Request) => {
  // Rate limit: 20 view registrations per minute per IP
  const ip = getClientIp(req);
  const { success } = await limiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { pageId } = await req.json();
  if (!pageId) {
    return NextResponse.json(
      { error: "pageId required" },
      { status: 400 }
    );
  }

  // Validate that the page actually exists
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: { id: true },
  });
  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const view = await prisma.pageView.create({ data: { pageId } });
  return NextResponse.json({ viewId: view.id });
});
