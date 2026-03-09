/**
 * GET /api/ref?token=<refToken>&slug=<slug>
 *
 * Validates a ref token, sets the tracking cookie, and redirects back
 * to the published page without the ?ref= param.
 *
 * This exists because Server Components cannot set cookies — only
 * Route Handlers and Server Actions can.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const slug = req.nextUrl.searchParams.get("slug");

  if (!token || !slug) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const contact = await prisma.pageContact.findUnique({
    where: { refToken: token },
    select: { pageId: true, page: { select: { slug: true } } },
  });

  if (!contact || contact.page.slug !== slug) {
    // Invalid token — redirect to page without ref
    return NextResponse.redirect(new URL(`/p/${slug}`, req.url));
  }

  // Build redirect URL preserving other query params (name, company)
  const target = new URL(`/p/${slug}`, req.url);
  for (const [key, val] of req.nextUrl.searchParams.entries()) {
    if (key !== "token" && key !== "slug") {
      target.searchParams.set(key, val);
    }
  }

  const res = NextResponse.redirect(target);
  res.cookies.set(`sr_ref_${contact.pageId}`, token, {
    httpOnly: true,
    path: "/p/",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  return res;
}
