import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { withErrorHandler } from "@/lib/api-error";
import { isBotUserAgent } from "@/lib/bot-detect";

const limiter = rateLimit({ limit: 30, window: "60s" });

export const POST = withErrorHandler(async (req: Request) => {
  // Keep crawlers/preview fetchers out of analytics (200 so clients stay silent)
  if (isBotUserAgent(req.headers.get("user-agent"))) {
    return NextResponse.json({ skipped: true });
  }

  // Rate limit: 30 events per minute per IP
  const ip = getClientIp(req);
  const { success } = await limiter.limit(ip);
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

  // Validate that the page exists AND is published (prevent phantom data)
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: { published: true },
  });
  if (!page?.published) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  // Restrict allowed event types. "share" is fired client-side when a page's
  // link is copied to the clipboard (see editor-header); without it here that
  // share signal was silently 400'd and never reached the dashboard.
  const allowedTypes = ["link_click", "form_submission", "cta_click", "share"];
  if (!allowedTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
  }

  // Cap meta length to prevent oversized payloads
  let safeMeta = typeof meta === "string" ? meta.slice(0, 2048) : "";

  // Defense-in-depth: never store query strings/fragments of clicked links —
  // they can carry tokens, emails, and other PII
  if (type === "link_click") {
    try {
      const u = new URL(safeMeta);
      u.search = "";
      u.hash = "";
      safeMeta = u.toString();
    } catch {
      // not a URL — keep as-is
    }
  }

  await prisma.pageEvent.create({
    data: { pageId, type, meta: safeMeta },
  });
  return NextResponse.json({ ok: true });
});
