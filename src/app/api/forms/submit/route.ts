import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const limiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 });

/** Max total size of the serialised form data (bytes). */
const MAX_DATA_SIZE = 16_384; // 16 KB

export async function POST(req: Request) {
  // Rate limit: 5 form submissions per minute per IP
  const ip = getClientIp(req);
  const { success } = limiter.check(ip, 5);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json();
  const { pageId, formId, data } = body;

  if (!pageId || !formId || !data) {
    return NextResponse.json(
      { error: "pageId, formId, and data are required" },
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

  // Cap data size to prevent oversized payloads
  const serialised = JSON.stringify(data);
  if (serialised.length > MAX_DATA_SIZE) {
    return NextResponse.json(
      { error: "Form data too large" },
      { status: 413 }
    );
  }

  const submission = await prisma.formSubmission.create({
    data: {
      pageId,
      formId,
      data: serialised,
    },
  });

  // Also track as a PageEvent for analytics
  await prisma.pageEvent.create({
    data: {
      pageId,
      type: "form_submission",
      meta: JSON.stringify({ formId }),
    },
  });

  return NextResponse.json({ ok: true, id: submission.id });
}
