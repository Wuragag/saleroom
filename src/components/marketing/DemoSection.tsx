import Link from "next/link"

export default function DemoSection() {
  return (
    <>
      <style>{`
        .sr-demo-pill:hover { opacity: 0.9; }
      `}</style>
      <section
      style={{
        padding: "120px 0",
        background: "var(--sr-text)",
        color: "#FFFFFF",
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-serif), serif",
            fontSize: 48,
            fontWeight: 400,
            lineHeight: 1.1,
            margin: "0 0 20px",
            letterSpacing: "-0.01em",
          }}
        >
          Ready to close deals
          <br />
          <em>with confidence?</em>
        </h2>
        <p
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: 17,
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1.7,
            marginBottom: 40,
            maxWidth: 480,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Join 2,400+ account executives who know exactly what their
          buyers care about before every follow-up.
        </p>
        <div
          style={{
            display: "flex",
            gap: 16,
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/auth/signup"
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 15,
              fontWeight: 500,
              background: "#FFFFFF",
              color: "var(--sr-text)",
              borderRadius: 100,
              padding: "14px 32px",
              textDecoration: "none",
              transition: "opacity 150ms ease",
            }}
            className="sr-demo-pill"
          >
            Start free — no credit card
          </Link>
        </div>
      </div>
    </section>
    </>
  )
}
