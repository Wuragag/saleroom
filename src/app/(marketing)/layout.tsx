import type { Metadata } from "next"
import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"

// All marketing pages are fully static — no server-side data fetching needed.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Dealbeam — Know the moment your buyer reads your proposal",
  description:
    "Stop sending proposals into silence. Dealbeam gives you one beautiful link and tells you exactly how your buyer engages with every section.",
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <style>{`
        :root {
          --db-bg:            #FAFAF8;
          --db-surface:       #FFFFFF;
          --db-surface-dim:   #F3F3F1;
          --db-border:        #E8E8E5;
          --db-border-hover:  #D0D0CC;
          --db-text:          #111111;
          --db-text-secondary:#555555;
          --db-text-muted:    #999999;
          --db-accent:        #111111;
          --db-accent-subtle: #F5F5F3;
        }

        html { scroll-behavior: smooth; }
        body { background: #FAFAF8; }

        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "var(--db-bg)",
          color: "var(--db-text)",
        }}
      >
        <Navbar />
        {children}
        <Footer />
      </div>
    </>
  )
}
