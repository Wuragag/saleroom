import type { Metadata } from "next"
import { IBM_Plex_Mono } from "next/font/google"
import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import JsonLd from "@/components/marketing/JsonLd"
import { APP_NAME } from "@/lib/constants"
import { SITE_DESCRIPTION, SITE_URL, organizationJsonLd, webSiteJsonLd } from "@/lib/seo"
import "./marketing.css"

// Mono is the marketing site's metadata voice (chapter numbers, labels,
// captions) — loaded here so it doesn't weigh down the app chrome.
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: "500", // the only mono weight the site renders
  variable: "--font-mk-mono",
})

// All marketing pages are fully static — no server-side data fetching needed.
export const dynamic = "force-static"

const TITLE = `${APP_NAME} — One page. Every deal, in order.`

/**
 * Site-wide SEO defaults. Pages override title/description/canonical; the
 * OpenGraph image comes from ./opengraph-image.tsx (auto-wired by Next).
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: SITE_DESCRIPTION,
  applicationName: APP_NAME,
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: SITE_DESCRIPTION },
  keywords: [
    "deal page",
    "digital sales room",
    "sales proposal software",
    "mutual action plan",
    "proposal tracking",
    "buyer engagement analytics",
    "sales enablement",
  ],
}

/**
 * Marketing visual system: monochrome, light by default, dark opt-in via
 * `data-mk-theme="dark"` on <html> (toggled in the Navbar, persisted in
 * localStorage("mk-theme")). The inline script re-applies the saved theme
 * before first paint so there is no flash. Styles live in ./marketing.css.
 */
const THEME_INIT = `try{if(localStorage.getItem("mk-theme")==="dark")document.documentElement.setAttribute("data-mk-theme","dark")}catch(e){}`

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      <JsonLd data={[organizationJsonLd(), webSiteJsonLd()]} />
      <div className={`mk-root ${mono.variable}`}>
        <a href="#main" className="mk-skip">Skip to content</a>
        <Navbar />
        <main id="main">{children}</main>
        <Footer />
      </div>
    </>
  )
}
