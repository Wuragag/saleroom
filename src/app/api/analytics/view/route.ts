import { prisma } from "@/lib/prisma";
import { NextResponse, after } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { withErrorHandler } from "@/lib/api-error";
import { isBotUserAgent } from "@/lib/bot-detect";
import { trackEvent } from "@/lib/analytics-forwarder";

const limiter = rateLimit({ limit: 20, window: "60s" });

export const POST = withErrorHandler(async (req: Request) => {
  // Keep crawlers/preview fetchers out of analytics (200 so clients stay silent)
  if (isBotUserAgent(req.headers.get("user-agent"))) {
    return NextResponse.json({ skipped: true });
  }

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

  // Only published pages accumulate analytics
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: { published: true },
  });
  if (!page?.published) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const view = await prisma.pageView.create({ data: { pageId } });

  // Anonymous page view — no visitor identity at this layer, so mark it
  // anonymous (no person profile) and key it to the view id. Off the response
  // path; no-op unless a provider is configured.
  after(() =>
    trackEvent({
      distinctId: `view:${view.id}`,
      event: "page_view",
      anonymous: true,
      properties: { pageId },
    })
  );

  return NextResponse.json({ viewId: view.id });
});
