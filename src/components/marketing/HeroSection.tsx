"use client"

import Link from "next/link"

/* ─────────────────────────────────────────────
   BrowserMockup
   3-D tilted card that straightens on hover
────────────────────────────────────────────── */
function BrowserMockup() {
  return (
    <div
      className="sr-mockup-tilt"
      style={{
        borderRadius: 12,
        boxShadow:
          "0 0 0 1px #1E1E2E, 0 40px 80px rgba(0,0,0,0.6), 0 0 80px rgba(59,130,246,0.08)",
        overflow: "hidden",
      }}
    >
      {/* Chrome bar */}
      <div
        style={{
          background: "#1A1A27",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {/* Traffic-light dots */}
        <span
          style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57", display: "inline-block" }}
          aria-hidden="true"
        />
        <span
          style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFBD2E", display: "inline-block" }}
          aria-hidden="true"
        />
        <span
          style={{ width: 10, height: 10, borderRadius: "50%", background: "#28CA42", display: "inline-block" }}
          aria-hidden="true"
        />
        {/* URL bar */}
        <div
          style={{
            flex: 1,
            marginLeft: 8,
            background: "#0F0F17",
            borderRadius: 6,
            padding: "5px 12px",
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontSize: 12,
            color: "#5C5C7A",
          }}
        >
          acme.salesroom.app/q4-proposal
        </div>
      </div>

      {/* Page content */}
      <div
        style={{
          background: "#0F0F17",
          height: 380,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            padding: "0 20px",
            borderBottom: "1px solid #1E1E2E",
            flexShrink: 0,
          }}
        >
          {["Overview", "Pricing", "Team", "Next Steps"].map((tab) => {
            const active = tab === "Pricing"
            return (
              <div
                key={tab}
                style={{
                  padding: "12px 16px",
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: 12,
                  color: active ? "#F8F7F4" : "#5C5C7A",
                  borderBottom: active ? "2px solid #3B82F6" : "2px solid transparent",
                  cursor: "default",
                  userSelect: "none",
                  marginBottom: -1,
                  transition: "color 150ms",
                }}
              >
                {tab}
              </div>
            )
          })}
        </div>

        {/* Content area */}
        <div style={{ padding: "20px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            {/* Logo placeholder */}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: "#1E1E2E",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ width: 22, height: 22, borderRadius: 4, background: "#2E2E3E" }} />
            </div>

            <div>
              <div
                style={{
                  fontFamily: "var(--font-syne), sans-serif",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#F8F7F4",
                  marginBottom: 4,
                }}
              >
                Hi Sarah 👋
              </div>
              <div
                style={{
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: 11,
                  color: "#5C5C7A",
                }}
              >
                Q4 Partnership Proposal · Acme Corp
              </div>
            </div>
          </div>

          {/* Grey content lines */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { w: "100%", h: 8 },
              { w: "82%",  h: 8 },
              { w: "95%",  h: 8 },
              { w: "60%",  h: 8 },
            ].map((line, i) => (
              <div
                key={i}
                style={{
                  width: line.w,
                  height: line.h,
                  borderRadius: 4,
                  background: "#1E1E2E",
                }}
              />
            ))}
          </div>

          {/* Two pricing blocks */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
            {[
              { label: "Starter", price: "$29", highlight: false },
              { label: "Enterprise", price: "$149", highlight: true },
            ].map(({ label, price, highlight }) => (
              <div
                key={label}
                style={{
                  background: highlight ? "rgba(59,130,246,0.08)" : "#13131A",
                  border: `1px solid ${highlight ? "rgba(59,130,246,0.3)" : "#1E1E2E"}`,
                  borderRadius: 8,
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 4,
                      background: highlight ? "rgba(59,130,246,0.2)" : "#1E1E2E",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-syne), sans-serif",
                      fontSize: 14,
                      fontWeight: 700,
                      color: highlight ? "#F8F7F4" : "#A8A8B3",
                    }}
                  >
                    {price}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {[70, 50, 85].map((w, i) => (
                    <div
                      key={i}
                      style={{
                        width: `${w}%`,
                        height: 5,
                        borderRadius: 3,
                        background: highlight ? "rgba(59,130,246,0.2)" : "#1E1E2E",
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Engagement bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              background: "#13131A",
              border: "1px solid #1E1E2E",
              borderRadius: 8,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#10B981",
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, height: 5, borderRadius: 3, background: "#1E1E2E", overflow: "hidden" }}>
              <div
                style={{
                  width: "68%",
                  height: "100%",
                  borderRadius: 3,
                  background: "linear-gradient(90deg, #3B82F6, #10B981)",
                }}
              />
            </div>
            <span
              style={{
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: 10,
                color: "#5C5C7A",
                flexShrink: 0,
              }}
            >
              68% read
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   NotificationCard
   Floats top-right of the mockup, animates in
────────────────────────────────────────────── */
function NotificationCard() {
  return (
    <div
      className="sr-anim-notif"
      style={{
        position: "absolute",
        top: -20,
        right: -20,
        width: 260,
        background: "#0F0F17",
        border: "1px solid #2E2E3E",
        borderLeft: "3px solid #3B82F6",
        borderRadius: 12,
        padding: "14px 18px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        zIndex: 10,
      }}
      role="status"
      aria-label="Live activity notification"
    >
      {/* Live indicator dot in top-right */}
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "#3B82F6",
        }}
        className="sr-blink-dot"
        aria-hidden="true"
      />

      {/* Row 1 */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          marginBottom: 6,
          paddingRight: 16,
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }} aria-hidden="true">
          👀
        </span>
        <span
          style={{
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontSize: 13,
            fontWeight: 500,
            color: "#F8F7F4",
            lineHeight: 1.4,
          }}
        >
          Sarah from Acme just opened your page
        </span>
      </div>

      {/* Row 2 */}
      <div
        style={{
          fontFamily: "var(--font-dm-sans), sans-serif",
          fontSize: 12,
          color: "#A8A8B3",
          marginBottom: 6,
          paddingLeft: 26,
        }}
      >
        Spent 4m 32s on Pricing tab
      </div>

      {/* Row 3 */}
      <div
        style={{
          fontFamily: "var(--font-dm-sans), sans-serif",
          fontSize: 11,
          color: "#5C5C7A",
          paddingLeft: 26,
        }}
      >
        2 minutes ago
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   HeroSection — main export
────────────────────────────────────────────── */
export default function HeroSection() {
  return (
    <>
      <style>{`
        /* ── Keyframes ── */
        @keyframes sr-fade-up-16 {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sr-fade-up-20 {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sr-fade-up-12 {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sr-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes sr-fade-card {
          from { opacity: 0; transform: translateY(-10px) translateX(10px); }
          to   { opacity: 1; transform: translateY(0) translateX(0); }
        }
        @keyframes sr-pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(59,130,246,0.55); }
          100% { box-shadow: 0 0 0 7px rgba(59,130,246,0); }
        }
        @keyframes sr-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.25; }
        }

        /* ── Stagger load animations ── */
        .sr-anim-badge  { opacity: 0; animation: sr-fade-up-16 500ms cubic-bezier(0.16,1,0.3,1) 0ms   forwards; }
        .sr-anim-h1     { opacity: 0; animation: sr-fade-up-20 500ms cubic-bezier(0.16,1,0.3,1) 100ms  forwards; }
        .sr-anim-sub    { opacity: 0; animation: sr-fade-up-16 500ms cubic-bezier(0.16,1,0.3,1) 200ms  forwards; }
        .sr-anim-cta    { opacity: 0; animation: sr-fade-up-16 500ms cubic-bezier(0.16,1,0.3,1) 300ms  forwards; }
        .sr-anim-social { opacity: 0; animation: sr-fade-up-12 500ms cubic-bezier(0.16,1,0.3,1) 400ms  forwards; }
        .sr-anim-right  { opacity: 0; animation: sr-fade-in    500ms cubic-bezier(0.16,1,0.3,1) 200ms  forwards; }
        .sr-anim-notif  { opacity: 0; animation: sr-fade-card  400ms ease-out               1500ms  forwards; }

        /* ── Live indicators ── */
        .sr-pulse-dot { animation: sr-pulse-ring 2s ease-out infinite; }
        .sr-blink-dot { animation: sr-blink 1.5s ease-in-out infinite; }

        /* ── Mockup 3-D tilt ── */
        .sr-mockup-tilt {
          transform: perspective(1200px) rotateY(-5deg) rotateX(2deg);
          transition: transform 400ms ease-out;
          will-change: transform;
        }
        .sr-mockup-wrap:hover .sr-mockup-tilt {
          transform: perspective(1200px) rotateY(0deg) rotateX(0deg);
        }

        /* ── Primary CTA button ── */
        .sr-btn-primary {
          display: inline-block;
          background: #3B82F6;
          color: #0A0A0F;
          border-radius: 10px;
          padding: 16px 32px;
          font-family: var(--font-syne), sans-serif;
          font-size: 16px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          border: none;
          transition: filter 200ms ease, transform 200ms ease, box-shadow 200ms ease;
          white-space: nowrap;
          line-height: 1;
        }
        .sr-btn-primary:hover {
          filter: brightness(1.1);
          transform: translateY(-2px);
          box-shadow: 0 20px 40px rgba(59,130,246,0.3);
        }

        /* ── Secondary link ── */
        .sr-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 16px;
          color: #A8A8B3;
          text-decoration: none;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          transition: color 150ms ease;
        }
        .sr-btn-secondary:hover { color: #F8F7F4; }
        .sr-btn-secondary .sr-arrow {
          display: inline-block;
          transition: transform 150ms ease;
        }
        .sr-btn-secondary:hover .sr-arrow { transform: translateX(3px); }

        /* ── Reduced motion ── */
        @media (prefers-reduced-motion: reduce) {
          .sr-anim-badge,
          .sr-anim-h1,
          .sr-anim-sub,
          .sr-anim-cta,
          .sr-anim-social,
          .sr-anim-right,
          .sr-anim-notif {
            animation: none;
            opacity: 1;
            transform: none;
          }
          .sr-pulse-dot,
          .sr-blink-dot {
            animation: none;
          }
        }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .sr-hero-grid {
            grid-template-columns: 1fr !important;
            gap: 60px !important;
          }
          .sr-h1 { font-size: 56px !important; }
          .sr-right-col { max-width: 520px; margin: 0 auto; }
        }
        @media (max-width: 640px) {
          .sr-h1 { font-size: 42px !important; }
          .sr-hero-section { padding: 100px 0 60px !important; }
          .sr-cta-row { flex-direction: column !important; align-items: flex-start !important; }
          .sr-notif-card { display: none; }
        }
      `}</style>

      <section
        className="sr-hero-section"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          padding: "120px 0 80px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", width: "100%" }}
        >
          <div
            className="sr-hero-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "55fr 45fr",
              gap: 80,
              alignItems: "center",
            }}
          >
            {/* ══════════════════════════════════
                LEFT COLUMN
            ══════════════════════════════════ */}
            <div>
              {/* Badge */}
              <div className="sr-anim-badge" style={{ marginBottom: 24 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#13131A",
                    border: "1px solid #2E2E3E",
                    borderRadius: 100,
                    padding: "6px 16px 6px 10px",
                  }}
                >
                  <span
                    className="sr-pulse-dot"
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: "#3B82F6",
                      flexShrink: 0,
                      display: "inline-block",
                    }}
                    aria-hidden="true"
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-dm-sans), sans-serif",
                      fontSize: 13,
                      color: "#A8A8B3",
                    }}
                  >
                    Used by 2,400+ Account Executives
                  </span>
                </div>
              </div>

              {/* H1 */}
              <h1
                className="sr-anim-h1 sr-h1"
                style={{
                  fontFamily: "var(--font-syne), sans-serif",
                  fontSize: 72,
                  fontWeight: 800,
                  lineHeight: 1.05,
                  letterSpacing: "-0.03em",
                  color: "#F8F7F4",
                  margin: 0,
                }}
              >
                Know the{" "}
                <span
                  style={{
                    textDecoration: "underline",
                    textDecorationColor: "#3B82F6",
                    textDecorationThickness: 3,
                    textUnderlineOffset: 6,
                  }}
                >
                  moment
                </span>
                <br />
                your buyer reads
                <br />
                your proposal.
              </h1>

              {/* Subheadline */}
              <p
                className="sr-anim-sub"
                style={{
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: 19,
                  color: "#A8A8B3",
                  lineHeight: 1.65,
                  marginTop: 24,
                  marginBottom: 0,
                  maxWidth: 480,
                }}
              >
                Stop sending proposals into silence.{" "}
                SalesRoom gives you one beautiful link{" "}
                and tells you exactly how your buyer{" "}
                engages with every section.
              </p>

              {/* CTA row */}
              <div
                className="sr-anim-cta sr-cta-row"
                style={{
                  marginTop: 40,
                  display: "flex",
                  gap: 16,
                  alignItems: "center",
                }}
              >
                <Link href="/auth/signup" className="sr-btn-primary">
                  Start free — no credit card
                </Link>

                <Link href="#demo" className="sr-btn-secondary">
                  See it in action
                  <span className="sr-arrow" aria-hidden="true">→</span>
                </Link>
              </div>

              {/* Social proof */}
              <div
                className="sr-anim-social"
                style={{
                  marginTop: 48,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "#13131A",
                    border: "1px solid #2E2E3E",
                    flexShrink: 0,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  aria-hidden="true"
                >
                  {/* Simple silhouette placeholder */}
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: "#2E2E3E",
                      marginBottom: -6,
                    }}
                  />
                </div>

                <div>
                  {/* Stars */}
                  <div
                    style={{
                      color: "#3B82F6",
                      fontSize: 14,
                      letterSpacing: 1,
                      marginBottom: 4,
                      lineHeight: 1,
                    }}
                    aria-label="5 out of 5 stars"
                  >
                    ★★★★★
                  </div>
                  {/* Quote */}
                  <p
                    style={{
                      fontFamily: "var(--font-dm-sans), sans-serif",
                      fontSize: 14,
                      color: "#A8A8B3",
                      fontStyle: "italic",
                      maxWidth: 340,
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    &ldquo;Closed a $50k deal faster because I knew exactly what to follow up on.&rdquo;
                  </p>
                  {/* Attribution */}
                  <p
                    style={{
                      fontFamily: "var(--font-dm-sans), sans-serif",
                      fontSize: 12,
                      color: "#5C5C7A",
                      margin: "4px 0 0",
                    }}
                  >
                    Alex Chen, AE at UserGems
                  </p>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════
                RIGHT COLUMN — Mockup
            ══════════════════════════════════ */}
            <div
              className="sr-anim-right sr-right-col sr-mockup-wrap"
              style={{ position: "relative" }}
            >
              <BrowserMockup />
              <div className="sr-notif-card">
                <NotificationCard />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
