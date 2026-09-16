import { ImageResponse } from "next/og"
import { APP_NAME } from "@/lib/constants"

export const alt = `${APP_NAME} — One page. Every deal, in order.`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/**
 * Social card for the marketing site (OpenGraph + Twitter). Black and white,
 * matching the site; Instrument Serif (TrueType) is fetched from Google Fonts at
 * build time and falls back to the renderer's default sans if unreachable.
 */
async function loadSerif(): Promise<ArrayBuffer | null> {
  try {
    // Satori (the OG renderer) reads TTF/OTF/WOFF but not WOFF2. Google
    // serves TrueType to clients that don't advertise a modern browser UA.
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Instrument+Serif&display=swap",
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; og-image)" } },
    ).then((r) => r.text())
    const url = css.match(/src: url\((https:[^)]+\.ttf)\)/)?.[1]
    if (!url) return null
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.arrayBuffer()
  } catch {
    return null
  }
}

export default async function Image() {
  const serif = await loadSerif()
  const family = serif ? "Instrument Serif" : "serif"
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FFFFFF",
          color: "#0A0A0A",
          padding: 72,
          fontFamily: family,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#0A0A0A", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
            {APP_NAME.charAt(0)}
          </div>
          <div style={{ fontSize: 30, letterSpacing: -0.5 }}>{APP_NAME}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 108, lineHeight: 0.98, letterSpacing: -3, display: "flex", flexDirection: "column" }}>
            <span>One page.</span>
            <span>Every deal, in order.</span>
          </div>
          <div style={{ fontSize: 30, color: "#575757", maxWidth: 900, lineHeight: 1.3 }}>
            Proposal, pricing and next steps in one link your buyer opens without logging in — and every read, as it happens.
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#8A8A8A", letterSpacing: 3, textTransform: "uppercase" }}>
          <span>Deal pages · Buyer intelligence · Action plans</span>
          <span>dealbeam.com</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: serif ? [{ name: "Instrument Serif", data: serif, style: "normal", weight: 400 }] : undefined,
    },
  )
}
