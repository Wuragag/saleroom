import Link from "next/link"
import JsonLd from "./JsonLd"
import { breadcrumbJsonLd, type Crumb } from "@/lib/seo"

/* ── Page hero (secondary pages) ───────────────────────────────────── */
export function PageHero({
  label,
  heading,
  headingAccent,
  subtitle,
  crumbs,
}: {
  label: string
  heading: string
  headingAccent?: string
  subtitle: string
  /** Breadcrumb trail (rendered + BreadcrumbList JSON-LD). */
  crumbs?: Crumb[]
}) {
  return (
    <section className="mk-page-hero" aria-labelledby="page-title">
      {crumbs && crumbs.length > 1 && <JsonLd data={breadcrumbJsonLd(crumbs)} />}
      <div className="mk-container-narrow">
        {crumbs && crumbs.length > 1 ? (
          <nav aria-label="Breadcrumb" className="mk-crumbs mk-enter" style={{ ["--i" as string]: 0 }}>
            {crumbs.map((c, i) => (
              <span key={c.path} style={{ display: "inline-flex", gap: 8 }}>
                {i > 0 && <span aria-hidden>/</span>}
                {i < crumbs.length - 1 ? <Link href={c.path}>{c.name}</Link> : <span aria-current="page">{c.name}</span>}
              </span>
            ))}
          </nav>
        ) : (
          <p className="mk-eyebrow mk-enter" style={{ ["--i" as string]: 0, margin: 0 }}>{label}</p>
        )}
        <h1 id="page-title" className="mk-h1 mk-enter" style={{ ["--i" as string]: 1, marginTop: 18 }}>
          {heading}
          {headingAccent && <>{" "}<br /><em>{headingAccent}</em></>}
        </h1>
        <p className="mk-lead mk-enter" style={{ ["--i" as string]: 2 }}>{subtitle}</p>
      </div>
    </section>
  )
}

/* ── CTA banner (ink) ──────────────────────────────────────────────── */
export function CTABanner({
  heading,
  headingAccent,
  subtitle,
  ctaLabel = "Start free — no credit card",
  ctaHref = "/auth/signup",
}: {
  heading: string
  headingAccent?: string
  subtitle: string
  ctaLabel?: string
  ctaHref?: string
}) {
  return (
    <section className="mk-phil mk-ink" style={{ padding: "112px 0" }} aria-labelledby="cta-title">
      <div className="mk-container-narrow" style={{ textAlign: "center" }}>
        <h2 id="cta-title" className="mk-h1">
          {heading}
          {headingAccent && <>{" "}<br /><em>{headingAccent}</em></>}
        </h2>
        <p className="mk-lead" style={{ color: "var(--db-ink-muted)", maxWidth: 480, margin: "20px auto 36px" }}>{subtitle}</p>
        <Link href={ctaHref} className="mk-cta mk-cta-lg mk-cta-inverse">{ctaLabel}</Link>
      </div>
    </section>
  )
}

/* ── Feature card ──────────────────────────────────────────────────── */
export function FeatureCard({
  title,
  description,
  label,
  href,
  preview,
}: {
  title: string
  description: string
  label: string
  href?: string
  preview?: React.ReactNode
}) {
  const content = (
    <article className="mk-card mk-card-hover" style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {preview && <div className="mk-preview" aria-hidden><div>{preview}</div></div>}
      <div style={{ padding: "24px 26px 26px", display: "flex", flexDirection: "column", flex: 1 }}>
        <p className="mk-eyebrow" style={{ margin: "0 0 10px" }}>{label}</p>
        <h3 className="mk-h3" style={{ fontSize: 24, marginBottom: 10 }}>{title}</h3>
        <p className="mk-body" style={{ fontSize: 14.5, flex: 1 }}>{description}</p>
        {href && <span className="mk-arrow" style={{ marginTop: 18 }}>Learn more <span aria-hidden>→</span></span>}
      </div>
    </article>
  )
  if (href) return <Link href={href} style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}>{content}</Link>
  return content
}
