import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { withErrorHandler } from "@/lib/api-error";

const limiter = rateLimit({ limit: 10, window: "60s" });

/**
 * POST /api/pages/[id]/gate
 * Email gate submission: creates/finds a PageContact and sets a ref cookie.
 * Body: { email: string, name?: string }
 */
export const POST = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const ip = getClientIp(req);
    const { success } = await limiter.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id: pageId } = await params;
    const body = await req.json();
    const email = (body.email as string)?.trim().toLowerCase();
    const name = (body.name as string)?.trim() || null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Only accept gate submissions for a published page that actually uses the
    // email gate. Without this, any pageId could be spammed with fabricated
    // contacts — including on unpublished/private pages that never show a gate.
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { id: true, requireEmail: true, published: true },
    });

    if (!page || !page.published || !page.requireEmail) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Upsert the contact
    const contact = await prisma.pageContact.upsert({
      where: { pageId_email: { pageId, email } },
      update: { ...(name ? { name } : {}) },
      create: {
        pageId,
        email,
        name,
        refToken: nanoid(12),
      },
    });

    // Set the ref cookie so future visits bypass the gate
    const cookieStore = await cookies();
    cookieStore.set(`sr_ref_${pageId}`, contact.refToken, {
      httpOnly: true,
      path: "/p/",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[gate POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
