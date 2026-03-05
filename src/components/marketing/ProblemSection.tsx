"use client"

const CARDS = [
  {
    emoji: "📎",
    title: "The attachment avalanche",
    body: "You craft the perfect email. Attach the deck, the case study, the one-pager, the Loom video. Your buyer sees 6 things to click and closes the tab.",
  },
  {
    emoji: "👻",
    title: "The follow-up void",
    body: "You wait 3 days. Send a 'just checking in'. Wait 3 more days. You have no idea if they even opened what you sent.",
  },
  {
    emoji: "❓",
    title: "Flying blind on the call",
    body: "You get back on the call with no intel. Did they look at pricing? Do they care about the case study? You're guessing every question.",
  },
]

export default function ProblemSection() {
  return (
    <>
      <style>{`
        .sr-prob-card {
          background: #0F0F17;
          border: 1px solid #1E1E2E;
          border-radius: 16px;
          padding: 36px 32px;
          transition: border-color 200ms ease, transform 200ms ease;
        }
        .sr-prob-card:hover {
          border-color: #2E2E3E;
          transform: translateY(-4px);
        }
        @media (max-width: 860px) {
          .sr-prob-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .sr-prob-h2  { font-size: 36px !important; }
          .sr-prob-close { font-size: 26px !important; }
          .sr-prob-section { padding: 80px 0 !important; }
        }
      `}</style>

      <section className="sr-prob-section" style={{ padding: "120px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>

          {/* ── Section label + heading ── */}
          <div style={{ textAlign: "center" }}>
            <span style={{
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 12,
              color: "#5C5C7A",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}>
              The Problem
            </span>
            <h2
              className="sr-prob-h2"
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
              You send the perfect follow-up.
              <br />
              Then nothing.
            </h2>
          </div>

          {/* ── Three problem cards ── */}
          <div
            className="sr-prob-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 24,
              marginTop: 64,
            }}
          >
            {CARDS.map((card) => (
              <div key={card.title} className="sr-prob-card">
                <div style={{ fontSize: 48, marginBottom: 20, lineHeight: 1 }}>{card.emoji}</div>
                <h3
                  style={{
                    fontFamily: "var(--font-syne), sans-serif",
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#F8F7F4",
                    margin: "0 0 12px",
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    fontSize: 15,
                    color: "#A8A8B3",
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  {card.body}
                </p>
              </div>
            ))}
          </div>

          {/* ── Closing statement ── */}
          <div style={{ textAlign: "center", marginTop: 80 }}>
            <p
              className="sr-prob-close"
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontSize: 36,
                fontWeight: 700,
                color: "#F8F7F4",
                lineHeight: 1.25,
                margin: 0,
              }}
            >
              Deals don&apos;t die on calls.
              <br />
              They die between them.
            </p>

            {/* Accent divider */}
            <div
              style={{
                width: 200,
                height: 2,
                margin: "40px auto 0",
                background: "linear-gradient(90deg, transparent, #3B82F6, transparent)",
              }}
            />
          </div>
        </div>
      </section>
    </>
  )
}
