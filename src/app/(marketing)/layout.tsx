import type { Metadata } from "next"
import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"

// All marketing pages are fully static — no server-side data fetching needed.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "SalesRoom — Know the moment your buyer reads your proposal",
  description:
    "Stop sending proposals into silence. SalesRoom gives you one beautiful link and tells you exactly how your buyer engages with every section.",
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
          --sr-bg:            #FAFAF8;
          --sr-surface:       #FFFFFF;
          --sr-surface-dim:   #F3F3F1;
          --sr-border:        #E8E8E5;
          --sr-border-hover:  #D0D0CC;
          --sr-text:          #111111;
          --sr-text-secondary:#555555;
          --sr-text-muted:    #999999;
          --sr-accent:        #111111;
          --sr-accent-subtle: #F5F5F3;
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
          background: "var(--sr-bg)",
          color: "var(--sr-text)",
        }}
      >
        <Navbar />
        {children}
        <Footer />
      </div>
    </>
  )
}
