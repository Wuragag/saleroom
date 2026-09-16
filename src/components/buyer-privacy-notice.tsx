"use client";

import { useEffect, useState } from "react";
import {
  REPLAY_CONSENT_EVENT,
  dismissNotice,
  hasGlobalPrivacyControl,
  isNoticeDismissed,
  readReplayConsent,
  shouldAskForReplay,
  writeReplayConsent,
} from "@/lib/buyer-consent";

interface Props {
  pageId: string;
  /** Seller has switched on session replay for this page. */
  recordingEnabled: boolean;
  accentColor: string;
}

/**
 * Buyer-facing transparency bar on published pages.
 *
 * GDPR / KVKK: buyers must be told, at the moment of collection, that the
 * sender sees how the page is read (Art. 13 / KVKK Art. 10). Reading
 * analytics run on the seller's legitimate interest; session replay is more
 * intrusive, so it is strictly opt-in — the recorder does not start until the
 * buyer clicks "Allow". A Global Privacy Control signal is honoured as a
 * standing "no" and the question is not asked at all.
 */
export function BuyerPrivacyNotice({ pageId, recordingEnabled, accentColor }: Props) {
  const [visible, setVisible] = useState(false);
  const [askReplay, setAskReplay] = useState(false);

  useEffect(() => {
    const storage = typeof window !== "undefined" ? window.localStorage : null;
    const gpc = hasGlobalPrivacyControl(navigator as unknown as { globalPrivacyControl?: unknown });
    const consent = readReplayConsent(storage, pageId);
    const ask = shouldAskForReplay({ recordingEnabled, consent, gpc });
    setAskReplay(ask);
    // Always show when a replay answer is still needed; otherwise only until dismissed.
    setVisible(ask || !isNoticeDismissed(storage, pageId));
  }, [pageId, recordingEnabled]);

  if (!visible) return null;

  const answer = (value: "granted" | "denied") => {
    writeReplayConsent(window.localStorage, pageId, value);
    window.dispatchEvent(new CustomEvent(REPLAY_CONSENT_EVENT, { detail: { pageId, value } }));
    dismissNotice(window.localStorage, pageId);
    setVisible(false);
  };
  const close = () => {
    dismissNotice(window.localStorage, pageId);
    setVisible(false);
  };

  return (
    <div
      role="region"
      aria-label="Privacy notice"
      className="sr-no-record"
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 60,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          pointerEvents: "auto",
          maxWidth: 720,
          width: "100%",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "10px 16px",
          padding: "12px 16px",
          borderRadius: 14,
          background: "var(--pub-surface, #fff)",
          color: "var(--pub-body-color, #222)",
          border: "1px solid var(--pub-divider, rgba(0,0,0,.12))",
          boxShadow: "0 12px 32px -12px rgba(0,0,0,.35)",
          fontFamily: "var(--pub-font-body, system-ui, sans-serif)",
          fontSize: 13.5,
          lineHeight: 1.45,
        }}
      >
        <p style={{ margin: 0, flex: "1 1 320px" }}>
          The sender of this page can see how it is read — which sections, for how long.
          {askReplay && " They also asked to record scrolling and cursor movement on this page (form inputs are never captured)."}{" "}
          <a
            href="/legal/privacy#buyers"
            target="_blank"
            rel="noopener"
            style={{ color: accentColor, textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            Privacy notice
          </a>
        </p>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {askReplay ? (
            <>
              <button type="button" onClick={() => answer("denied")} style={btn(false, accentColor)}>
                No thanks
              </button>
              <button type="button" onClick={() => answer("granted")} style={btn(true, accentColor)}>
                Allow recording
              </button>
            </>
          ) : (
            <button type="button" onClick={close} style={btn(true, accentColor)} aria-label="Dismiss privacy notice">
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function btn(primary: boolean, accent: string): React.CSSProperties {
  return {
    fontFamily: "inherit",
    fontSize: 13,
    fontWeight: 600,
    padding: "8px 14px",
    borderRadius: 999,
    cursor: "pointer",
    border: `1px solid ${primary ? accent : "var(--pub-divider, rgba(0,0,0,.2))"}`,
    background: primary ? accent : "transparent",
    color: primary ? "#fff" : "inherit",
  };
}
