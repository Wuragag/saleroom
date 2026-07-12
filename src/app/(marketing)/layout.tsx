import type { Metadata } from "next"
import { IBM_Plex_Mono } from "next/font/google"
import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import { APP_NAME } from "@/lib/constants"

// Mono is the marketing site's metadata voice (chapter numbers, labels,
// captions) — loaded here so it doesn't weigh down the app chrome.
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mk-mono",
})

// All marketing pages are fully static — no server-side data fetching needed.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: `${APP_NAME} — One page. Every deal, in order.`,
  description: `Stop sending proposals into silence. ${APP_NAME} turns proposal, pricing and next steps into one link your buyer actually reads — and tells you the moment they do.`,
}

/**
 * Marketing visual system ("Website" design). Light + dark palettes live on
 * the --db-* custom properties; dark mode is opt-in via the
 * `data-mk-theme="dark"` attribute on <html>, toggled from the Navbar and
 * persisted in localStorage("mk-theme"). The inline script below re-applies
 * the saved theme before first paint so there is no flash.
 */
const THEME_INIT = `try{if(localStorage.getItem("mk-theme")==="dark")document.documentElement.setAttribute("data-mk-theme","dark")}catch(e){}`

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      <style>{`
        :root {
          --db-bg:            #F6F6F7;
          --db-surface:       #FFFFFF;
          --db-surface-dim:   #F1F1F2;
          --db-border:        #E7E7E9;
          --db-border-hover:  #D8D8DC;
          --db-text:          #17171A;
          --db-text-secondary:#5F5F66;
          --db-text-muted:    #97979F;
          --db-accent:        #17171A;
          --db-accent-subtle: #F1F1F2;
          --db-on-accent:     #FFFFFF;
          --db-shadow-1: 0 1px 2px rgba(20,20,24,0.06);
          --db-shadow-2: 0 4px 14px rgba(20,20,24,0.08);
          --db-shadow-3: 0 16px 40px rgba(20,20,24,0.14);
          --db-cta-grad: linear-gradient(180deg, #35353C 0%, #1B1B1F 55%, #111114 100%);
          --db-cta-grad-hover: linear-gradient(180deg, #4C4C55 0%, #2E2E34 55%, #202024 100%);
          --db-cta-shadow: inset 0 1px 0 rgba(255,255,255,0.22), inset 0 0 0 1px rgba(255,255,255,0.06), 0 1px 2px rgba(20,20,24,0.35), 0 4px 12px rgba(20,20,24,0.22);
          --db-cta-shadow-hover: inset 0 1px 0 rgba(255,255,255,0.28), inset 0 0 0 1px rgba(255,255,255,0.08), 0 2px 4px rgba(20,20,24,0.35), 0 8px 20px rgba(20,20,24,0.28);
        }
        :root[data-mk-theme="dark"] {
          --db-bg:            #101013;
          --db-surface:       #18181C;
          --db-surface-dim:   #1F1F24;
          --db-border:        #2A2A30;
          --db-border-hover:  #3A3A42;
          --db-text:          #F5F5F6;
          --db-text-secondary:#A4A4AD;
          --db-text-muted:    #6E6E78;
          --db-accent:        #F5F5F6;
          --db-accent-subtle: #1F1F24;
          --db-on-accent:     #131316;
          --db-shadow-1: 0 1px 2px rgba(0,0,0,0.4);
          --db-shadow-2: 0 4px 14px rgba(0,0,0,0.45);
          --db-shadow-3: 0 16px 40px rgba(0,0,0,0.55);
          --db-cta-grad: linear-gradient(180deg, #FFFFFF 0%, #E9E9EE 60%, #D8D8DF 100%);
          --db-cta-grad-hover: linear-gradient(180deg, #FFFFFF 0%, #DADAE0 60%, #C4C4CC 100%);
          --db-cta-shadow: inset 0 1px 0 rgba(255,255,255,0.9), inset 0 0 0 1px rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.4);
          --db-cta-shadow-hover: inset 0 1px 0 rgba(255,255,255,1), inset 0 0 0 1px rgba(255,255,255,0.25), 0 2px 4px rgba(0,0,0,0.5), 0 8px 20px rgba(0,0,0,0.45);
        }

        html { scroll-behavior: smooth; }
        body { background: var(--db-bg); }

        .mk-root ::selection { background: var(--db-accent); color: var(--db-on-accent); }

        /* Background artwork: line art stays legible in both themes. */
        .mk-art { filter: grayscale(1) invert(1) contrast(1.04); }
        :root[data-mk-theme="dark"] .mk-art { filter: grayscale(1) contrast(1.04); }

        /* Primary CTA pill, shared across nav / hero / pricing / final CTA. */
        .mk-cta {
          font-size: 14px; font-weight: 500;
          color: var(--db-on-accent);
          background: var(--db-cta-grad);
          border-radius: 999px;
          padding: 10px 20px;
          text-decoration: none;
          box-shadow: var(--db-cta-shadow);
          transition: background .15s ease, box-shadow .15s ease, transform .1s ease;
        }
        .mk-cta:hover { background: var(--db-cta-grad-hover); box-shadow: var(--db-cta-shadow-hover); }
        .mk-cta:active { transform: scale(0.97); }
        .mk-cta-lg { font-size: 15px; padding: 14px 30px; }

        /* Metadata voice: mono, uppercase, hairline-adjacent. */
        .mk-eyebrow {
          font-family: var(--font-mk-mono), ui-monospace, monospace;
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: var(--db-text-muted);
        }
        .mk-h2 {
          font-family: var(--font-serif), Georgia, serif;
          font-weight: 400; font-size: clamp(36px, 4.6vw, 52px); line-height: 1.05;
          letter-spacing: -0.015em; margin: 0;
        }

        /* Chapter header: full-width rule, mono label left, note right. */
        .mk-chapter {
          border-top: 1px solid var(--db-border);
          padding-top: 16px;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 16px;
        }

        /* Animated wireframe graphics (feature cards + product mocks). */
        @keyframes wg-grow { 0%,100% { transform: scaleY(0.28); } 50% { transform: scaleY(1); } }
        @keyframes wg-type { 0% { width: 0; } 55%,100% { width: 100%; } }
        @keyframes wg-caret { 0%,49% { opacity: 1; } 50%,100% { opacity: 0; } }
        @keyframes wg-pulse { 0% { transform: scale(0.5); opacity: 0.7; } 100% { transform: scale(2.4); opacity: 0; } }
        @keyframes wg-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes wg-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }

        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          [data-wg] *, [data-wg] { animation: none !important; }
        }
      `}</style>

      <div
        className={`mk-root ${mono.variable}`}
        style={{
          minHeight: "100vh",
          background: "var(--db-bg)",
          color: "var(--db-text)",
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          transition: "background-color .25s ease, color .25s ease",
        }}
      >
        <Navbar />
        {children}
        <Footer />
      </div>
    </>
  )
}
