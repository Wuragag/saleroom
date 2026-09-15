import Link from "next/link"
import { BENTO } from "@/data/marketing/landing"
import { BENTO_VISUALS } from "./product-ui"
import ScrollReveal from "./ScrollReveal"

export default function FeatureBento() {
  return (
    <section id="details" className="mk-section" aria-labelledby="details-title">
      <div className="mk-container">
        <div className="mk-chapter">
          <span className="mk-eyebrow">03 &mdash; Details</span>
          <span className="mk-eyebrow">Small things, done properly</span>
        </div>
        <div className="mk-chapter-head split">
          <h2 id="details-title" className="mk-h2">Built for the whole deal, <em>not the demo.</em></h2>
          <div>
            <p className="mk-lead" style={{ maxWidth: 440 }}>Everything below is shipped and documented. Nothing here is a roadmap.</p>
            <Link href="/features" className="mk-arrow" style={{ marginTop: 16 }}>All features <span aria-hidden>→</span></Link>
          </div>
        </div>
        <div className="mk-bento">
          {BENTO.map((item, i) => {
            const Visual = BENTO_VISUALS[item.visual]
            return (
              <ScrollReveal key={item.title} as="article" className={`mk-card mk-card-hover mk-bento-item${item.wide ? " wide" : ""}`} delay={(i % 4) * 80} distance={18}>
                <div className="mk-bento-vis" aria-hidden><Visual /></div>
                <div className="mk-bento-copy">
                  <h3 className="mk-h4">{item.title}</h3>
                  <p className="mk-body" style={{ fontSize: 14 }}>{item.body}</p>
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
