import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Build an absolute URL from the request's ACTUAL origin.
 *
 * `req.url` / `req.nextUrl` inside an `auth()`-wrapped middleware do not
 * reliably reflect the real incoming host — they can be normalized against
 * AUTH_URL/NEXTAUTH_URL instead (verified: spoofing the Host header still
 * produced a redirect target matching NEXTAUTH_URL, not the request). Vercel
 * always sets x-forwarded-host/x-forwarded-proto to the true client-facing
 * values, so those are the reliable source for any URL this middleware builds.
 */
function absoluteUrl(req: Parameters<Parameters<typeof auth>[0]>[0], pathAndQuery: string): URL {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  return new URL(pathAndQuery, `${proto}://${host}`);
}

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Ref-token redirect: handled here (not in the ISR-cached /p/[slug] page)
  // because a redirect() call from inside a page using `revalidate` can be
  // unreliable — Next.js's ISR caching for that route doesn't consistently
  // honor a searchParams-conditional redirect. Middleware runs before any
  // page-level caching, so it's the reliable place for this.
  if (pathname.startsWith("/p/") && req.nextUrl.searchParams.has("ref")) {
    const slug = pathname.slice("/p/".length);
    const params = new URLSearchParams({
      token: req.nextUrl.searchParams.get("ref")!,
      slug,
    });
    const name = req.nextUrl.searchParams.get("name");
    const company = req.nextUrl.searchParams.get("company");
    if (name) params.set("name", name);
    if (company) params.set("company", company);
    return NextResponse.redirect(absoluteUrl(req, `/api/ref?${params.toString()}`));
  }

  // Always allow: marketing root, auth pages, public pages, and all API routes (they self-protect)
  if (
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/p/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/invite/") ||
    pathname.startsWith("/features") ||
    pathname.startsWith("/use-cases") ||
    pathname.startsWith("/examples") ||
    pathname.startsWith("/pricing")
  ) {
    // Authenticated users hitting the marketing root get sent straight to the app
    if (pathname === "/" && isLoggedIn) {
      return NextResponse.redirect(absoluteUrl(req, "/dashboard"));
    }
    return NextResponse.next();
  }

  // Allow onboarding pages only for authenticated users
  if (pathname.startsWith("/onboarding")) {
    if (!isLoggedIn) {
      const signInUrl = absoluteUrl(req, "/auth/signin");
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
  }

  // Redirect unauthenticated users to sign-in
  if (!isLoggedIn) {
    const signInUrl = absoluteUrl(req, "/auth/signin");
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // NOTE: Onboarding check is handled in server components (not middleware)
  // to avoid stale-JWT redirect loops. See dashboard page.tsx.

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and Next.js internals.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
