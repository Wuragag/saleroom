import { serializeJsonLd } from "@/lib/seo"

/**
 * Inline JSON-LD block. Accepts one or more schema.org objects; each renders as
 * its own <script type="application/ld+json"> so crawlers that only read the
 * first object per script still see everything.
 */
export default function JsonLd({ data }: { data: object | object[] }) {
  const items = Array.isArray(data) ? data : [data]
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(item) }}
        />
      ))}
    </>
  )
}
