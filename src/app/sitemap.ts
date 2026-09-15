import type { MetadataRoute } from "next"
import { absoluteUrl } from "@/lib/seo"
import { FEATURES } from "@/data/marketing/features"
import { LEGAL_DOCUMENTS } from "@/data/legal/documents"

/** Static marketing routes only — app and buyer pages are private. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  const top: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/pricing"), lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: absoluteUrl("/features"), lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/use-cases"), lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/examples"), lastModified, changeFrequency: "monthly", priority: 0.6 },
  ]
  const features: MetadataRoute.Sitemap = FEATURES.map((f) => ({
    url: absoluteUrl(`/features/${f.slug}`),
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }))
  const legal: MetadataRoute.Sitemap = LEGAL_DOCUMENTS.map((d) => ({
    url: absoluteUrl(`/legal/${d.slug}`),
    lastModified,
    changeFrequency: "yearly",
    priority: 0.3,
  }))
  return [...top, ...features, ...legal]
}
