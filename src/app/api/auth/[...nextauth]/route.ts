import { handlers } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const limiter = rateLimit({ limit: 5, window: "60s" });

const { GET, POST: originalPost } = handlers;

/**
 * Wrap the NextAuth POST handler with rate limiting for login attempts.
 * Only the credentials sign-in action is rate-limited (5/min per IP).
 */
async function POST(request: NextRequest) {
  // Rate limit credential logins: check if this is a sign-in request
  const isSignIn = request.nextUrl.pathname.endsWith("/callback/credentials");

  if (isSignIn) {
    const ip = getClientIp(request);
    const { success } = await limiter.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }
  }

  return originalPost(request);
}

export { GET, POST };
