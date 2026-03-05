"use client"

/* ─────────────────────────────────────────────
   Data
────────────────────────────────────────────── */
const SMALL_CARDS = [
  {
    quote:
      "Reactivated a $50k closed-lost deal. The VP spent over a minute on our page and booked from the calendar embed.",
    name: "Alex R.",
    role: "AE · Salesforce",
    initial: "A",
    color: "#3B82F6",
  },
  {
    quote:
      "I spend 70% less time on follow-up emails. One page, one link, done.",
    name: "Maria K.",
    role: "AE · HubSpot",
    initial: "M",
    color: "#10B981",
  },
  {
    quote:
      "My buyers actually engage with proposals now. Game changer for multi-stakeholder deals.",
    name: "Sam T.",
    role: "AE · Outreach",
    initial: "S",
    color: "#8B5CF6",
  },
]

const LOGOS = ["Salesforce", "HubSpot", "Gong", "Outreach", "UserGems", "Salesloft"]

/* ─────────────────────────────────────────────
   Sub-components
────────────────────────────────────────────── */
function Avatar({
  initial,
  color,
  size = 32,
  border,
}: {
  initial: string
  color: string
  size?: number
  border?: string
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `${color}1A`,
        border: border ?? `1px solid ${color}40`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontSize: size * 0.38,
          fontWeight: 700,
          color: color,
        }}
      >
        {initial}
      </span>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Main export
────────────────────────────────────────────── */
export default function SocialProofSection() {
  return (
    <>
      <style>{`
        .sr-proof-small-card {
          background: #0F0F17;
          border: 1px solid #1E1E2E;
          border-radius: 16px;
          padding: 28px;
          transition: border-color 200ms ease, transform 200ms ease;
        }
        .sr-proof-small-card:hover {
          border-color: #2E2E3E;
          transform: translateY(-3px);
        }
        .sr-proof-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 36px;
          padding: 0 18px;
          background: #13131A;
          border: 1px solid #1E1E2E;
          border-radius: 8px;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 12px;
          color: #5C5C7A;
          filter: grayscale(1) opacity(0.4);
          transition: filter 200ms ease;
          cursor: default;
          white-space: nowrap;
        }
        .sr-proof-logo:hover { filter: grayscale(0) opacity(1); }

        @media (max-width: 860px) {
          .sr-proof-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .sr-proof-h2 { font-size: 36px !important; }
          .sr-proof-featured { padding: 32px 24px !important; }
          .sr-proof-featured-quote { font-size: 20px !important; }
          .sr-proof-logo-bar { flex-wrap: wrap !important; justify-content: center !important; }
          .sr-proof-section { padding: 80px 0 !important; }
        }
      `}</style>

      <section className="sr-proof-section" style={{ padding: "120px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>

          {/* ── Section label + heading ── */}
          <div style={{ textAlign: "center" }}>
            <span
              style={{
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: 12,
                color: "#5C5C7A",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              Real Results
            </span>
            <h2
              className="sr-proof-h2"
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontSize: 52,
                fontWeight: 800,
                color: "#F8F7F4",
                lineHeight: 1.1,
                textAlign: "center",
                marginTop: 12,
                marginBottom: 0,
              }}
            >
              Deals closed with SalesRoom
            </h2>
          </div>

          {/* ── Featured testimonial ── */}
          <div
            className="sr-proof-featured"
            style={{
              position: "relative",
              background: "linear-gradient(135deg, #0D1829 0%, #0F0F17 100%)",
              border: "1px solid rgba(59,130,246,0.2)",
              borderRadius: 20,
              padding: "48px 56px",
              marginTop: 56,
              marginBottom: 24,
              overflow: "hidden",
            }}
          >
            {/* Giant quote mark */}
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 16,
                left: 24,
                fontFamily: "var(--font-syne), sans-serif",
                fontSize: 120,
                color: "#3B82F6",
                opacity: 0.15,
                lineHeight: 1,
                userSelect: "none",
                pointerEvents: "none",
              }}
            >
              &ldquo;
            </span>

            {/* Quote */}
            <blockquote
              className="sr-proof-featured-quote"
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontSize: 28,
                fontWeight: 600,
                color: "#F8F7F4",
                lineHeight: 1.4,
                margin: "0 0 36px",
                position: "relative",
                paddingLeft: 16,
              }}
            >
              SalesRoom became my mutual action plan for every deal. When a new stakeholder joins,
              I send them the page. They&apos;re up to speed in 4 minutes. That alone shortened my
              sales cycle by 3 weeks.
            </blockquote>

            {/* Attribution row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                position: "relative",
              }}
            >
              <Avatar
                initial="J"
                color="#3B82F6"
                size={48}
                border="2px solid #3B82F6"
              />
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#F8F7F4",
                  }}
                >
                  Jordan Lee
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    fontSize: 14,
                    color: "#A8A8B3",
                  }}
                >
                  Senior AE, Enterprise · Gong
                </div>
              </div>

              {/* Metric badge */}
              <div
                style={{
                  marginLeft: "auto",
                  background: "rgba(59,130,246,0.12)",
                  border: "1px solid rgba(59,130,246,0.3)",
                  borderRadius: 100,
                  padding: "6px 16px",
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#3B82F6",
                  whiteSpace: "nowrap",
                }}
              >
                $300k+ closed with SalesRoom
              </div>
            </div>
          </div>

          {/* ── Three smaller cards ── */}
          <div
            className="sr-proof-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 24,
              marginBottom: 80,
            }}
          >
            {SMALL_CARDS.map((card) => (
              <div key={card.name} className="sr-proof-small-card">
                {/* Stars */}
                <div
                  style={{
                    color: "#3B82F6",
                    fontSize: 13,
                    letterSpacing: 1,
                    marginBottom: 14,
                  }}
                  aria-label="5 stars"
                >
                  ★★★★★
                </div>

                {/* Quote */}
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    fontSize: 15,
                    color: "#A8A8B3",
                    lineHeight: 1.65,
                    fontStyle: "italic",
                    margin: "0 0 20px",
                    flex: 1,
                  }}
                >
                  &ldquo;{card.quote}&rdquo;
                </p>

                {/* Attribution */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar initial={card.initial} color={card.color} size={32} />
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-dm-sans), sans-serif",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#F8F7F4",
                      }}
                    >
                      {card.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-dm-sans), sans-serif",
                        fontSize: 12,
                        color: "#5C5C7A",
                      }}
                    >
                      {card.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Logo bar ── */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <span
              style={{
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: 13,
                color: "#5C5C7A",
              }}
            >
              Trusted by AEs at:
            </span>
          </div>
          <div
            className="sr-proof-logo-bar"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            {LOGOS.map((name) => (
              <div key={name} className="sr-proof-logo">
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
