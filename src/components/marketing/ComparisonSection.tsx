"use client"

import { useEffect, useRef, useState } from "react"

const OLD_WAY = [
  "Attach 5 PDFs to an email and hope they open the right one",
  "No idea if your prospect read it or forwarded it",
  "Follow up blindly — 'Just checking in…'",
  "Static files that look the same as everyone else's",
  "Version chaos when pricing or terms change",
]

const NEW_WAY = [
  "One beautiful link with everything in one place",
  "See exactly who viewed it and which sections they read",
  "Follow up at the perfect moment with real context",
  "A branded, interactive page that stands out",
  "Always up to date — edit once, live everywhere",
]

function AnimatedCheck({ delay, inView }: { delay: number; inView: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      style={{
        flexShrink: 0,
        opacity: inView ? 1 : 0,
        transform: inView ? "scale(1)" : "scale(0.5)",
        transition: `opacity 400ms ${delay}ms ease, transform 400ms ${delay}ms ease`,
      }}
    >
      <circle cx="9" cy="9" r="9" fill="var(--db-text)" />
      <path
        d="M5.5 9L8 11.5L12.5 6.5"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function ComparisonSection() {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <style>{`
        .sr-compare-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }
        @media (max-width: 768px) {
          .sr-compare-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          .sr-compare-h2 { font-size: 36px !important; }
          .sr-compare-section { padding: 80px 0 !important; }
        }
      `}</style>

      <section
        className="sr-compare-section"
        style={{
          padding: "120px 0",
          borderTop: "1px solid var(--db-border)",
        }}
      >
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px" }}>
          {/* Heading */}
          <div style={{ marginBottom: 64, maxWidth: 560 }}>
            <p
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--db-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 16,
              }}
            >
              Before &amp; After
            </p>
            <h2
              className="sr-compare-h2"
              style={{
                fontFamily: "var(--font-serif), serif",
                fontSize: 48,
                fontWeight: 400,
                color: "var(--db-text)",
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              Your proposals deserve
              <br />
              <em>better than an inbox.</em>
            </h2>
          </div>

          <div ref={ref} className="sr-compare-grid">
            {/* Old way */}
            <div>
              <div
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--db-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 24,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="var(--db-text-muted)" strokeWidth="1.5" />
                  <path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke="var(--db-text-muted)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Emails, PDFs &amp; attachments
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {OLD_WAY.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "16px 0",
                      borderBottom: "1px solid var(--db-border)",
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: 15,
                      color: "var(--db-text-muted)",
                      lineHeight: 1.6,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      opacity: inView ? 1 : 0,
                      transform: inView ? "none" : "translateY(10px)",
                      transition: `opacity 500ms ${i * 60}ms ease, transform 500ms ${i * 60}ms ease`,
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      style={{ flexShrink: 0, marginTop: 2 }}
                    >
                      <circle cx="9" cy="9" r="9" fill="var(--db-surface-dim)" />
                      <path
                        d="M6.5 6.5L11.5 11.5M11.5 6.5L6.5 11.5"
                        stroke="var(--db-text-muted)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* New way */}
            <div>
              <div
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--db-text)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 24,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" fill="var(--db-text)" />
                  <path d="M5 8L7 10L11 6" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Dealbeam
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {NEW_WAY.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "16px 0",
                      borderBottom: "1px solid var(--db-border)",
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: 15,
                      color: "var(--db-text)",
                      lineHeight: 1.6,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      opacity: inView ? 1 : 0,
                      transform: inView ? "none" : "translateY(10px)",
                      transition: `opacity 500ms ${i * 60 + 200}ms ease, transform 500ms ${i * 60 + 200}ms ease`,
                    }}
                  >
                    <span style={{ marginTop: 2 }}>
                      <AnimatedCheck delay={i * 60 + 200} inView={inView} />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
