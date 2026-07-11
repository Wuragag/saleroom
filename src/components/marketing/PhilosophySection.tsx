import { LANDING_TENETS } from "@/data/marketing/landing"

export default function PhilosophySection() {
  return (
    <>
      <style>{`
        @media (max-width: 900px) {
          .mk-phil { grid-template-columns: 1fr !important; gap: 32px !important; padding: 72px 24px !important; }
          .mk-phil-left { position: static !important; }
        }
      `}</style>
      <section
        id="philosophy"
        style={{
          borderTop: "1px solid var(--db-border)",
          borderBottom: "1px solid var(--db-border)",
          background: "var(--db-surface)",
        }}
      >
        <div
          className="mk-phil"
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "112px 24px",
            display: "grid",
            gridTemplateColumns: "5fr 7fr",
            gap: 64,
            alignItems: "start",
          }}
        >
          <div
            className="mk-phil-left"
            style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 96 }}
          >
            <span className="mk-eyebrow">Why</span>
            <h2 className="mk-h2" style={{ textWrap: "balance" }}>
              The deal is lost in the noise, not in the room.
            </h2>
            <p
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontStyle: "italic",
                fontSize: 20,
                lineHeight: 1.5,
                color: "var(--db-text-secondary)",
                margin: "12px 0 0",
                borderTop: "1px solid var(--db-border)",
                paddingTop: 20,
                textWrap: "pretty",
              }}
            >
              “If it is not right, do not do it; if it is not true, do not say it.”
              <br />
              <span
                style={{
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontStyle: "normal",
                  fontSize: 13,
                  color: "var(--db-text-muted)",
                }}
              >
                — Marcus Aurelius
              </span>
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {LANDING_TENETS.map((t) => (
              <div
                key={t.numeral}
                style={{ display: "flex", gap: 24, padding: "28px 0", borderBottom: "1px solid var(--db-border)" }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: 22,
                    color: "var(--db-text-muted)",
                    flexShrink: 0,
                    width: 36,
                  }}
                >
                  {t.numeral}
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em" }}>{t.title}</span>
                  <span style={{ fontSize: 15, lineHeight: 1.65, color: "var(--db-text-secondary)", textWrap: "pretty" }}>
                    {t.body}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
