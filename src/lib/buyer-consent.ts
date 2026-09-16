/**
 * Buyer-side privacy helpers for published pages (/p/[slug]).
 *
 * Pure functions only — storage access is injected so the decision logic is
 * unit-testable. Used by the privacy notice (UI) and the analytics tracker
 * (which must not start session replay until the buyer allows it).
 */

export type ReplayConsent = "granted" | "denied" | null

export const noticeKey = (pageId: string) => `db_privacy_notice_${pageId}`
export const replayConsentKey = (pageId: string) => `db_replay_consent_${pageId}`

/** Name of the DOM event the notice dispatches when the buyer answers. */
export const REPLAY_CONSENT_EVENT = "db:replay-consent"

export interface ConsentStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export function readReplayConsent(storage: ConsentStorage | null | undefined, pageId: string): ReplayConsent {
  try {
    const v = storage?.getItem(replayConsentKey(pageId))
    return v === "granted" || v === "denied" ? v : null
  } catch {
    return null
  }
}

export function writeReplayConsent(storage: ConsentStorage | null | undefined, pageId: string, value: Exclude<ReplayConsent, null>): void {
  try {
    storage?.setItem(replayConsentKey(pageId), value)
  } catch {
    // private mode — the answer simply won't persist across visits
  }
}

export function isNoticeDismissed(storage: ConsentStorage | null | undefined, pageId: string): boolean {
  try {
    return storage?.getItem(noticeKey(pageId)) === "1"
  } catch {
    return false
  }
}

export function dismissNotice(storage: ConsentStorage | null | undefined, pageId: string): void {
  try {
    storage?.setItem(noticeKey(pageId), "1")
  } catch {
    // ignore
  }
}

/**
 * Global Privacy Control (https://globalprivacycontrol.org) — a browser
 * signal that US state laws (CPRA, Colorado, Connecticut…) require honouring
 * as an opt-out. We treat it as a standing "no" to session replay.
 */
export function hasGlobalPrivacyControl(nav: { globalPrivacyControl?: unknown } | null | undefined): boolean {
  return nav?.globalPrivacyControl === true
}

/**
 * Whether the recorder may run right now. Replay is opt-in: it needs the
 * seller to have enabled it AND an explicit "granted" from this buyer, and
 * a GPC signal always wins.
 */
export function shouldRecordSession(opts: { recordingEnabled: boolean; consent: ReplayConsent; gpc: boolean }): boolean {
  if (!opts.recordingEnabled) return false
  if (opts.gpc) return false
  return opts.consent === "granted"
}

/**
 * Whether the notice bar should ask the replay question (as opposed to only
 * informing). Asked only while no answer is stored and GPC is not set.
 */
export function shouldAskForReplay(opts: { recordingEnabled: boolean; consent: ReplayConsent; gpc: boolean }): boolean {
  return opts.recordingEnabled && !opts.gpc && opts.consent === null
}
