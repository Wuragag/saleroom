import { STEPS, indexLabel } from "@/data/marketing/landing"
import ScrollReveal from "./ScrollReveal"

export default function HowItWorks() {
  return (
    <section id="how" className="mk-section-tight" aria-labelledby="how-title">
      <div className="mk-container">
        <div className="mk-chapter">
          <span className="mk-eyebrow">02 &mdash; Method</span>
          <span className="mk-eyebrow">Three moves, in order</span>
        </div>
        <div className="mk-chapter-head split">
          <h2 id="how-title" className="mk-h2">Write. Send. <em>Act on evidence.</em></h2>
          <p className="mk-lead" style={{ maxWidth: 440 }}>A deal page takes minutes to make and seconds to open. What comes back is the part that matters.</p>
        </div>
        <ol className="mk-steps" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {STEPS.map((s, i) => (
            <ScrollReveal key={s.title} as="li" className="mk-step" delay={i * 110}>
              <div className="mk-step-n" aria-hidden>{indexLabel(i)}</div>
              <h3 className="mk-h3">{s.title}</h3>
              <p className="mk-body">{s.body}</p>
            </ScrollReveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
