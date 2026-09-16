import Link from "next/link"
import type { LegalDocument, LegalBlock } from "@/data/legal/documents"
import { LEGAL, LEGAL_LINKS } from "@/data/legal/entity"
import JsonLd from "./JsonLd"
import { breadcrumbJsonLd } from "@/lib/seo"

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

function Block({ b }: { b: LegalBlock }) {
  switch (b.type) {
    case "p":
      return <p>{b.text}</p>
    case "ul":
      return <ul>{b.items.map((i) => <li key={i}>{i}</li>)}</ul>
    case "ol":
      return <ol>{b.items.map((i) => <li key={i}>{i}</li>)}</ol>
    case "table":
      return (
        <div className="mk-table-wrap">
          <table>
            <thead><tr>{b.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, k) => <td key={k}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )
    case "note":
      return <aside className="mk-note">{b.text}</aside>
  }
}

/**
 * Renders a structured legal document: sticky table of contents, anchored
 * H2 sections, tables for cookies/sub-processors. Content lives in
 * src/data/legal/documents.ts so the wording is reviewable as data.
 */
export default function LegalPage({ doc }: { doc: LegalDocument }) {
  const crumbs = [{ name: "Home", path: "/" }, { name: "Legal", path: "/legal/privacy" }, { name: doc.shortTitle, path: `/legal/${doc.slug}` }]
  return (
    <article className="mk-legal" lang={doc.lang}>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <header className="mk-page-hero" style={{ textAlign: "left", paddingBottom: 32 }}>
        <div className="mk-container">
          <p className="mk-eyebrow mk-enter" style={{ ["--i" as string]: 0, margin: 0 }}>{doc.eyebrow}</p>
          <h1 className="mk-h1 mk-enter" style={{ ["--i" as string]: 1, marginTop: 18, maxWidth: 860 }}>{doc.title}</h1>
          <p className="mk-lead mk-enter" style={{ ["--i" as string]: 2, maxWidth: 680, marginTop: 20 }}>{doc.summary}</p>
          <p className="mk-small mk-enter" style={{ ["--i" as string]: 3, marginTop: 16 }}>
            {doc.effectiveLabel} {LEGAL.effectiveDate}
          </p>
        </div>
      </header>
      <div className="mk-container">
        <div className="mk-legal-grid">
          <nav className="mk-legal-toc" aria-label={doc.tocLabel}>
            <p className="mk-eyebrow">{doc.tocLabel}</p>
            <ol>
              {doc.sections.map((s) => (
                <li key={s.heading}><a href={`#${s.id ?? slugify(s.heading)}`}>{s.heading}</a></li>
              ))}
            </ol>
            <p className="mk-eyebrow" style={{ marginTop: 28 }}>{doc.relatedLabel}</p>
            <ul className="mk-legal-related">
              {LEGAL_LINKS.filter((l) => !l.href.startsWith(`/legal/${doc.slug}`)).map((l) => (
                <li key={l.href}><Link href={l.href}>{l.label}</Link></li>
              ))}
            </ul>
          </nav>
          <div className="mk-prose">
            {doc.sections.map((s) => (
              <section key={s.heading} id={s.id ?? slugify(s.heading)} aria-labelledby={`${s.id ?? slugify(s.heading)}-h`}>
                <h2 id={`${s.id ?? slugify(s.heading)}-h`}>{s.heading}</h2>
                {s.blocks.map((b, i) => <Block key={i} b={b} />)}
              </section>
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}
