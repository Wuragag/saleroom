import { describe, expect, it } from "vitest"
import {
  dismissNotice,
  hasGlobalPrivacyControl,
  isNoticeDismissed,
  noticeKey,
  readReplayConsent,
  replayConsentKey,
  shouldAskForReplay,
  shouldRecordSession,
  writeReplayConsent,
} from "../buyer-consent"

function memStorage(initial: Record<string, string> = {}) {
  const m = new Map(Object.entries(initial))
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
}

describe("storage keys", () => {
  it("are scoped per page so one answer never leaks to another page", () => {
    expect(replayConsentKey("p1")).not.toBe(replayConsentKey("p2"))
    expect(noticeKey("p1")).toBe("db_privacy_notice_p1")
  })
})

describe("readReplayConsent / writeReplayConsent", () => {
  it("round-trips granted and denied and ignores garbage", () => {
    const s = memStorage({ [replayConsentKey("x")]: "maybe" })
    expect(readReplayConsent(s, "x")).toBeNull()
    writeReplayConsent(s, "x", "granted")
    expect(readReplayConsent(s, "x")).toBe("granted")
    writeReplayConsent(s, "x", "denied")
    expect(readReplayConsent(s, "x")).toBe("denied")
  })
  it("tolerates a missing or throwing storage", () => {
    expect(readReplayConsent(null, "x")).toBeNull()
    const throwing = { getItem: () => { throw new Error("blocked") }, setItem: () => { throw new Error("blocked") } }
    expect(readReplayConsent(throwing, "x")).toBeNull()
    expect(() => writeReplayConsent(throwing, "x", "granted")).not.toThrow()
  })
})

describe("notice dismissal", () => {
  it("persists per page", () => {
    const s = memStorage()
    expect(isNoticeDismissed(s, "a")).toBe(false)
    dismissNotice(s, "a")
    expect(isNoticeDismissed(s, "a")).toBe(true)
    expect(isNoticeDismissed(s, "b")).toBe(false)
  })
})

describe("shouldRecordSession", () => {
  it("never records without the seller enabling replay", () => {
    expect(shouldRecordSession({ recordingEnabled: false, consent: "granted", gpc: false })).toBe(false)
  })
  it("never records without explicit buyer consent", () => {
    expect(shouldRecordSession({ recordingEnabled: true, consent: null, gpc: false })).toBe(false)
    expect(shouldRecordSession({ recordingEnabled: true, consent: "denied", gpc: false })).toBe(false)
  })
  it("records only with enabled + granted + no GPC", () => {
    expect(shouldRecordSession({ recordingEnabled: true, consent: "granted", gpc: false })).toBe(true)
    expect(shouldRecordSession({ recordingEnabled: true, consent: "granted", gpc: true })).toBe(false)
  })
})

describe("shouldAskForReplay", () => {
  it("asks only while unanswered, enabled and no GPC", () => {
    expect(shouldAskForReplay({ recordingEnabled: true, consent: null, gpc: false })).toBe(true)
    expect(shouldAskForReplay({ recordingEnabled: true, consent: "denied", gpc: false })).toBe(false)
    expect(shouldAskForReplay({ recordingEnabled: true, consent: null, gpc: true })).toBe(false)
    expect(shouldAskForReplay({ recordingEnabled: false, consent: null, gpc: false })).toBe(false)
  })
})

describe("hasGlobalPrivacyControl", () => {
  it("only honours the boolean true signal", () => {
    expect(hasGlobalPrivacyControl({ globalPrivacyControl: true })).toBe(true)
    expect(hasGlobalPrivacyControl({ globalPrivacyControl: "1" })).toBe(false)
    expect(hasGlobalPrivacyControl(undefined)).toBe(false)
  })
})
