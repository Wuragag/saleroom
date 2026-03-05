/**
 * SalesRoom — Marketing Landing Page
 *
 * Route: / (via the (marketing) route group)
 *
 * ⚠️  ROUTING NOTE:
 * `src/app/page.tsx` also resolves to `/`, which creates a duplicate-route
 * conflict. Before deploying, either:
 *   a) Delete `src/app/page.tsx` and move its logic to a protected route
 *      (e.g. `src/app/(app)/dashboard/page.tsx`), or
 *   b) Rename this file to a different segment if you need both.
 *
 * This page is completely standalone — no auth, no Prisma, no app shell.
 */

import Navbar          from "@/components/marketing/Navbar"
import HeroSection     from "@/components/marketing/HeroSection"
import ProblemSection  from "@/components/marketing/ProblemSection"
import SolutionSection from "@/components/marketing/SolutionSection"
import DemoSection     from "@/components/marketing/DemoSection"
import SocialProofSection from "@/components/marketing/SocialProofSection"

/* ── Noise SVG (tiled, 2% opacity) ── */
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`

export default function MarketingPage() {
  return (
    <>
      {/* Inject marketing-scope CSS variables onto this page's wrapper */}
      <style>{`
        :root {
          --sr-bg:          #0A0A0F;
          --sr-bg-card:     #0F0F17;
          --sr-bg-subtle:   #13131A;
          --sr-border:      #1E1E2E;
          --sr-border-mid:  #2E2E3E;
          --sr-text:        #F8F7F4;
          --sr-text-muted:  #A8A8B3;
          --sr-text-dim:    #5C5C7A;
          --sr-accent:      #3B82F6;
          --sr-accent-dim:  #1D4ED8;
          --sr-green:       #10B981;
        }

        /* Prevent the default white body showing behind the dark wrapper */
        body { background: #0A0A0F; }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: `
            radial-gradient(ellipse 800px 600px at 90% -5%,  rgba(59,130,246,0.07) 0%, transparent 70%),
            radial-gradient(ellipse 600px 400px at -10% 100%, rgba(59,130,246,0.04) 0%, transparent 70%),
            #0A0A0F
          `,
          position: "relative",
          isolation: "isolate",
        }}
      >
        {/* Noise overlay — fixed so it covers the full viewport during scroll */}
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundImage: NOISE_SVG,
            backgroundRepeat: "repeat",
            backgroundSize: "200px 200px",
            opacity: 0.02,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Content layers sit above the noise */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <Navbar />
          <HeroSection />
          <ProblemSection />
          <SolutionSection />
          <DemoSection />
          <SocialProofSection />
        </div>
      </div>
    </>
  )
}
