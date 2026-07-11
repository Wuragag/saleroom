"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

const AI_FEATURES = [
  {
    title: "Draft proposals in seconds",
    description:
      "Describe your deal and let AI generate a polished first draft — complete with structure, tone, and key talking points tailored to your buyer.",
  },
  {
    title: "Rewrite and refine",
    description:
      "Highlight any section and get instant suggestions to sharpen your message. Adjust tone, simplify language, or expand on key points.",
  },
  {
    title: "Learn from what works",
    description:
      "AI surfaces patterns from your highest-performing pages — which sections get read longest, which CTAs convert — so every new proposal starts stronger.",
  },
]

export default function AISection() {
  const mockupRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = mockupRef.current
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
        .sr-ai-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }
        .sr-ai-pill:hover { opacity: 0.85; }
        @media (max-width: 900px) {
          .sr-ai-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          .sr-ai-visual { order: -1 !important; }
          .sr-ai-h2 { font-size: 36px !important; }
          .sr-ai-section { padding: 80px 0 !important; }
        }
      `}</style>

      <section
        className="sr-ai-section"
        style={{
          padding: "120px 0",
          background: "var(--db-surface)",
          borderTop: "1px solid var(--db-border)",
          borderBottom: "1px solid var(--db-border)",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
          <div className="sr-ai-grid">
            {/* Text side */}
            <div>
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
                AI-Powered
              </p>
              <h2
                className="sr-ai-h2"
                style={{
                  fontFamily: "var(--font-serif), serif",
                  fontSize: 44,
                  fontWeight: 400,
                  color: "var(--db-text)",
                  lineHeight: 1.1,
                  margin: "0 0 24px",
                }}
              >
                Write proposals that
                <br />
                <em>close themselves.</em>
              </h2>
              <p
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: 16,
                  color: "var(--db-text-secondary)",
                  lineHeight: 1.7,
                  margin: "0 0 36px",
                  maxWidth: 440,
                }}
              >
                Built-in AI helps you create better proposals faster — from first
                draft to final polish. Every suggestion is informed by real
                engagement data from your team&apos;s best-performing pages.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {AI_FEATURES.map((feature, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "20px 0",
                      borderTop: i === 0 ? "1px solid var(--db-border)" : "none",
                      borderBottom: "1px solid var(--db-border)",
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: "var(--font-inter), sans-serif",
                        fontSize: 16,
                        fontWeight: 600,
                        color: "var(--db-text)",
                        margin: "0 0 6px",
                      }}
                    >
                      {feature.title}
                    </h3>
                    <p
                      style={{
                        fontFamily: "var(--font-inter), sans-serif",
                        fontSize: 14,
                        color: "var(--db-text-secondary)",
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                href="/features/ai-content"
                className="sr-ai-pill"
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: 15,
                  fontWeight: 500,
                  background: "var(--db-text)",
                  color: "#FFFFFF",
                  borderRadius: 100,
                  padding: "14px 32px",
                  textDecoration: "none",
                  display: "inline-block",
                  marginTop: 32,
                  transition: "opacity 150ms ease",
                }}
              >
                Explore AI features
              </Link>
            </div>

            {/* Visual mockup */}
            <div className="sr-ai-visual" ref={mockupRef}>
              <div
                style={{
                  background: "var(--db-bg)",
                  borderRadius: 16,
                  border: "1px solid var(--db-border)",
                  boxShadow:
                    "0 24px 48px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
                  overflow: "hidden",
                }}
              >
                {/* Browser chrome */}
                <div
                  style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid var(--db-border)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "var(--db-surface)",
                  }}
                >
                  <div style={{ display: "flex", gap: 6 }}>
                    {["#FF5F57", "#FFBD2E", "#28CA42"].map((c) => (
                      <span
                        key={c}
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: c,
                          opacity: 0.8,
                        }}
                      />
                    ))}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      marginLeft: 8,
                      background: "var(--db-surface-dim)",
                      borderRadius: 8,
                      padding: "6px 14px",
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: 12,
                      color: "var(--db-text-muted)",
                    }}
                  >
                    app.dealbeam.com/editor
                  </div>
                </div>

                <div style={{ padding: 24 }}>
                  {/* Content placeholder lines */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      marginBottom: 20,
                    }}
                  >
                    {[100, 88, 94, 70].map((w, i) => (
                      <div
                        key={i}
                        style={{
                          width: `${w}%`,
                          height: 7,
                          borderRadius: 4,
                          background: "var(--db-surface-dim)",
                        }}
                      />
                    ))}
                  </div>

                  {/* AI panel */}
                  <div
                    style={{
                      background: "linear-gradient(135deg, #F8F7FF, #F5F3FF)",
                      border: "1px solid #E9E5FF",
                      borderRadius: 12,
                      padding: 18,
                      opacity: inView ? 1 : 0,
                      transform: inView
                        ? "translateY(0)"
                        : "translateY(16px)",
                      transition:
                        "opacity 600ms 200ms ease, transform 600ms 200ms ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 12,
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M8 1L10 6L15 6.5L11 10L12.5 15L8 12L3.5 15L5 10L1 6.5L6 6L8 1Z"
                          fill="#7C3AED"
                          opacity="0.7"
                        />
                      </svg>
                      <span
                        style={{
                          fontFamily: "var(--font-inter), sans-serif",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#7C3AED",
                        }}
                      >
                        AI Draft Ready
                      </span>
                    </div>

                    {/* Generated content lines */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        marginBottom: 14,
                      }}
                    >
                      {[
                        { w: 100, delay: 400 },
                        { w: 92, delay: 500 },
                        { w: 85, delay: 600 },
                        { w: 60, delay: 700 },
                      ].map(({ w, delay }, i) => (
                        <div
                          key={i}
                          style={{
                            width: inView ? `${w}%` : "0%",
                            height: 6,
                            borderRadius: 3,
                            background: "#DDD6FE",
                            transition: `width 500ms ${delay}ms ease`,
                          }}
                        />
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <div
                        style={{
                          padding: "6px 14px",
                          borderRadius: 6,
                          background: "#7C3AED",
                          fontFamily: "var(--font-inter), sans-serif",
                          fontSize: 12,
                          fontWeight: 500,
                          color: "#FFFFFF",
                        }}
                      >
                        Insert
                      </div>
                      <div
                        style={{
                          padding: "6px 14px",
                          borderRadius: 6,
                          border: "1px solid #E9E5FF",
                          fontFamily: "var(--font-inter), sans-serif",
                          fontSize: 12,
                          fontWeight: 500,
                          color: "#7C3AED",
                        }}
                      >
                        Regenerate
                      </div>
                      <div
                        style={{
                          padding: "6px 14px",
                          borderRadius: 6,
                          border: "1px solid #E9E5FF",
                          fontFamily: "var(--font-inter), sans-serif",
                          fontSize: 12,
                          fontWeight: 500,
                          color: "#7C3AED",
                        }}
                      >
                        Edit
                      </div>
                    </div>
                  </div>

                  {/* More content below */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      marginTop: 20,
                    }}
                  >
                    {[85, 92, 70].map((w, i) => (
                      <div
                        key={i}
                        style={{
                          width: `${w}%`,
                          height: 7,
                          borderRadius: 4,
                          background: "var(--db-surface-dim)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
