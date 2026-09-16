import type { Metadata } from "next"
import { notFound } from "next/navigation"
import LegalPage from "@/components/marketing/LegalPage"
import { LEGAL_DOCUMENTS } from "@/data/legal/documents"
import { pageTitle } from "@/lib/seo"

export function generateStaticParams() {
  return LEGAL_DOCUMENTS.map((d) => ({ slug: d.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const doc = LEGAL_DOCUMENTS.find((d) => d.slug === slug)
  if (!doc) return { title: pageTitle("Legal") }
  return {
    title: pageTitle(doc.shortTitle),
    description: doc.summary,
    alternates: { canonical: `/legal/${doc.slug}` },
    openGraph: { title: pageTitle(doc.shortTitle), description: doc.summary, url: `/legal/${doc.slug}` },
  }
}

export default async function LegalRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const doc = LEGAL_DOCUMENTS.find((d) => d.slug === slug)
  if (!doc) notFound()
  return <LegalPage doc={doc} />
}
