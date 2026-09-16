import { describe, expect, it } from "vitest"
import {
  absoluteUrl,
  breadcrumbJsonLd,
  faqJsonLd,
  normalizeOrigin,
  pageTitle,
  serializeJsonLd,
  softwareApplicationJsonLd,
  SITE_URL,
} from "../seo"

describe("normalizeOrigin", () => {
  it("strips whitespace and trailing slashes", () => {
    expect(normalizeOrigin("  https://dealbeam.com/// ")).toBe("https://dealbeam.com")
    expect(normalizeOrigin("https://dealbeam.com")).toBe("https://dealbeam.com")
  })
})

describe("absoluteUrl", () => {
  it("joins site-relative paths onto the canonical origin", () => {
    expect(absoluteUrl("/pricing")).toBe(`${SITE_URL}/pricing`)
    expect(absoluteUrl("pricing")).toBe(`${SITE_URL}/pricing`)
  })
  it("keeps a trailing slash on the root only", () => {
    expect(absoluteUrl("/")).toBe(`${SITE_URL}/`)
    expect(absoluteUrl()).toBe(`${SITE_URL}/`)
  })
})

describe("serializeJsonLd", () => {
  it("escapes < so text can never close the script tag", () => {
    const out = serializeJsonLd({ name: "</script><script>alert(1)" })
    expect(out).not.toContain("</script>")
    expect(out).toContain("\\u003c/script>")
    expect(JSON.parse(out)).toEqual({ name: "</script><script>alert(1)" })
  })
})

describe("faqJsonLd", () => {
  it("emits one Question per entry", () => {
    const ld = faqJsonLd([
      { question: "Do buyers need an account?", answer: "No." },
      { question: "Is there a free plan?", answer: "Yes." },
    ])
    expect(ld["@type"]).toBe("FAQPage")
    expect(ld.mainEntity).toHaveLength(2)
    expect(ld.mainEntity[0]).toMatchObject({
      "@type": "Question",
      name: "Do buyers need an account?",
      acceptedAnswer: { "@type": "Answer", text: "No." },
    })
  })
})

describe("breadcrumbJsonLd", () => {
  it("numbers positions from 1 and resolves absolute item URLs", () => {
    const ld = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Features", path: "/features" },
      { name: "Analytics", path: "/features/analytics" },
    ])
    expect(ld.itemListElement.map((i) => i.position)).toEqual([1, 2, 3])
    expect(ld.itemListElement[2].item).toBe(`${SITE_URL}/features/analytics`)
  })
})

describe("softwareApplicationJsonLd", () => {
  it("attaches a monthly price specification only to paid offers", () => {
    const ld = softwareApplicationJsonLd({
      offers: [
        { name: "Free", priceMonthly: 0 },
        { name: "Pro", priceMonthly: 29 },
      ],
      featureList: ["Deal pages"],
    })
    expect(ld.offers[0]).not.toHaveProperty("priceSpecification")
    expect(ld.offers[1]).toMatchObject({
      price: 29,
      priceCurrency: "USD",
      priceSpecification: { billingDuration: "P1M" },
    })
  })
})

describe("pageTitle", () => {
  it("puts the section first and the brand last", () => {
    expect(pageTitle("Pricing")).toBe("Pricing — Dealbeam")
    expect(pageTitle()).toBe("Dealbeam")
  })
})
