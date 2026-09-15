import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/seo"

/**
 * /robots.txt — the public marketing site is crawlable; the app, buyer pages
 * (private deal rooms), previews and API are not. AI crawlers get the same
 * rules as search engines: the marketing pages + llms.txt are what we want
 * them to read.
 */
export default function robots(): MetadataRoute.Robots {
  const disallow = [
    "/api/",
    "/dashboard",
    "/editor/",
    "/preview/",
    "/p/",
    "/analytics",
    "/deals",
    "/settings",
    "/admin",
    "/ai",
    "/library",
    "/submissions",
    "/onboarding",
    "/invite/",
    "/auth/",
  ]
  return {
    rules: [{ userAgent: "*", allow: ["/", "/llms.txt"], disallow }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
