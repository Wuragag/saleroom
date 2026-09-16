import Link from "next/link"
import { LANDING_TEMPLATES, type LandingTemplate } from "@/data/marketing/landing"

function TemplateCard({ t, decorative }: { t: LandingTemplate; decorative?: boolean }) {
  const inner = (
    <>
      <div className={`mk-tpl-cover ${t.tone}`}>
        <span className="k">{t.kind}</span>
        <span className="t">{t.title}</span>
      </div>
      <div className="mk-tpl-body">
        <div className="mk-tpl-tabs">{t.tabs.map((tab) => <span key={tab}>{tab}</span>)}</div>
        <span className="mk-ui-line soft" style={{ display: "block", width: "88%" }} />
        <span className="mk-ui-line soft" style={{ display: "block", width: "64%", marginTop: 6 }} />
        <div className="mk-ui-row" style={{ justifyContent: "space-between", marginTop: 12 }}>
          <span className="mk-ui-label">Use template</span><span className="mk-ui-muted" aria-hidden>→</span>
        </div>
      </div>
    </>
  )
  if (decorative) return <div className="mk-tpl" aria-hidden>{inner}</div>
  return <Link href="/auth/signup" className="mk-tpl" aria-label={`Start from the ${t.title} template`}>{inner}</Link>
}

/**
 * Eight seeded templates as an endless marquee (the set is rendered twice for
 * a seamless -50% loop; the copy is aria-hidden so links aren't duplicated).
 */
export default function TemplateGallery() {
  return (
    <section id="templates" className="mk-section-tight" aria-labelledby="templates-title" style={{ overflow: "hidden" }}>
      <div className="mk-container">
        <div className="mk-chapter">
          <span className="mk-eyebrow">04 &mdash; Templates</span>
          <span className="mk-eyebrow">Eight built in · save your own</span>
        </div>
        <div className="mk-chapter-head split" style={{ paddingBottom: 32 }}>
          <h2 id="templates-title" className="mk-h2">Start from a <em>proven page.</em></h2>
          <div>
            <p className="mk-lead" style={{ maxWidth: 440 }}>Call recap to ROI study. Each one already has the tabs a buyer expects; you supply what is true about this deal.</p>
            <Link href="/examples" className="mk-arrow" style={{ marginTop: 16 }}>See examples <span aria-hidden>→</span></Link>
          </div>
        </div>
      </div>
      <div className="mk-marquee">
        <div className="mk-marquee-track">
          {LANDING_TEMPLATES.map((t) => <TemplateCard key={t.title} t={t} />)}
          {LANDING_TEMPLATES.map((t) => <TemplateCard key={`${t.title}-dup`} t={t} decorative />)}
        </div>
      </div>
    </section>
  )
}
