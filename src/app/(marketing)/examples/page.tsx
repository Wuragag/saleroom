import type { Metadata } from "next"
import { EXAMPLES } from "@/data/marketing/examples"
import { PageHero, CTABanner } from "@/components/marketing/shared"
import ScrollReveal from "@/components/marketing/ScrollReveal"
import { APP_DOMAIN } from "@/lib/constants"
import { pageTitle } from "@/lib/seo"

const DESCRIPTION = "Example Dealbeam deal pages: enterprise proposals, customer onboarding, investor updates, QBRs, mutual action plans and agency pitches — each split into tabs a buyer expects."

export const metadata: Metadata = {
  title: pageTitle("Examples"),
  description: DESCRIPTION,
  alternates: { canonical: "/examples" },
  openGraph: { title: pageTitle("Examples"), description: DESCRIPTION, url: "/examples" },
}

const TONES = ["ink", "paper", "dim"] as const

function ExampleCard({ title, category, description, tabs, tone }: { title: string; category: string; description: string; tabs: string[]; tone: (typeof TONES)[number] }) {
  return (
    <article className="mk-card mk-card-hover mk-example">
      <div className="mk-example-shot" aria-hidden>
        <div className="mk-example-page">
          <div className="mk-frame-bar" style={{ padding: "8px 12px" }}>
            <span className="mk-frame-dots"><span /><span /><span /></span>
            <span className="mk-frame-url" style={{ fontSize: 10 }}>{APP_DOMAIN}/p/{title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}</span>
          </div>
          <div className={`mk-tpl-cover ${tone}`} style={{ height: 64, padding: "10px 14px", justifyContent: "flex-end" }}>
            <span className="t" style={{ fontSize: 16 }}>{title}</span>
          </div>
          <div className="mk-example-tabs">{tabs.map((t) => <span key={t}>{t}</span>)}</div>
          <div style={{ padding: "12px 14px 0", display: "flex", flexDirection: "column", gap: 6 }}>
            {[96, 80, 88, 58].map((w, i) => <span key={i} className="mk-ui-line soft" style={{ width: `${w}%`, height: 6 }} />)}
          </div>
        </div>
      </div>
      <div style={{ padding: "22px 24px 26px" }}>
        <p className="mk-eyebrow" style={{ margin: "0 0 8px" }}>{category}</p>
        <h3 className="mk-h3" style={{ fontSize: 22, marginBottom: 8 }}>{title}</h3>
        <p className="mk-body" style={{ fontSize: 14 }}>{description}</p>
      </div>
    </article>
  )
}

export default function ExamplesPage() {
  return (
    <>
      <PageHero
        label="Examples"
        heading="What a deal page"
        headingAccent="looks like."
        subtitle="Six pages the way sellers actually build them — each with the tabs a buyer expects and nothing they don't."
        crumbs={[{ name: "Home", path: "/" }, { name: "Examples", path: "/examples" }]}
      />
      <section className="mk-section-tight" style={{ paddingTop: 8 }} aria-label="Example pages">
        <div className="mk-container">
          <div className="mk-grid-3">
            {EXAMPLES.map((ex, i) => (
              <ScrollReveal key={ex.title} delay={(i % 3) * 80} distance={18}>
                <ExampleCard {...ex} tone={TONES[i % TONES.length]} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
      <CTABanner heading="Start from one of these," headingAccent="or from a blank page." subtitle="Your first page is free. No credit card required." />
    </>
  )
}
