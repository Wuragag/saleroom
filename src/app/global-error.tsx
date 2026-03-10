"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{ textAlign: "center", maxWidth: "400px", padding: "24px" }}
          >
            <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "12px" }}>
              Something went wrong
            </h1>
            <p style={{ color: "#666", marginBottom: "20px" }}>
              An unexpected error occurred.
            </p>
            <button
              onClick={reset}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                background: "#000",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
