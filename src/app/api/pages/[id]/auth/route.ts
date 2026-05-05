import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { withErrorHandler } from "@/lib/api-error";

// Strict rate limit for password attempts: 5 per minute per IP
const limiter = rateLimit({ limit: 5, window: "60s" });

export const POST = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  // Rate limit check
  const ip = getClientIp(request);
  const { success } = await limiter.limit(ip);
  if (!success) {
    return new NextResponse("Too many attempts. Please try again later.", {
      status: 429,
    });
  }

  // Basic Origin / Referer CSRF check for native form POSTs
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const requestUrl = new URL(request.url);
  const expectedOrigin = requestUrl.origin;

  if (origin && origin !== expectedOrigin) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  if (!origin && referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (refOrigin !== expectedOrigin) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    } catch {
      // Malformed referer — block
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const formData = await request.formData();
  const submittedPassword = formData.get("password") as string | null;

  // Always look up the page first so we use the trusted slug from the database,
  // never the user-supplied value (prevents open redirect via crafted slug).
  const page = await prisma.page.findUnique({
    where: { id },
    select: { id: true, slug: true, password: true },
  });

  if (!page || !page.password) {
    return new NextResponse("Page not found", { status: 404 });
  }

  if (!submittedPassword) {
    return NextResponse.redirect(
      new URL(`/p/${page.slug}/password?error=1`, request.url),
      { status: 303 }
    );
  }

  const passwordMatch = await bcrypt.compare(submittedPassword, page.password);
  if (!passwordMatch) {
    return NextResponse.redirect(
      new URL(`/p/${page.slug}/password?error=1`, request.url),
      { status: 303 }
    );
  }

  // Correct password — compute HMAC token with server secret.
  // Using HMAC ensures a DB leak alone can't forge auth tokens.
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET or NEXTAUTH_SECRET must be set");
  const token = crypto
    .createHmac("sha256", secret)
    .update(`${page.id}:${page.password}`)
    .digest("hex");

  const response = NextResponse.redirect(
    new URL(`/p/${page.slug}`, request.url),
    { status: 303 }
  );
  response.cookies.set(`page_auth_${page.id}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
    sameSite: "lax",
  });

  return response;
});
