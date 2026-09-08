import { describe, it, expect, beforeAll, vi, afterEach } from "vitest";
import {
  createImpersonateToken,
  verifyImpersonateToken,
} from "@/lib/impersonation";

// The token is HMAC-signed with AUTH_SECRET (falling back to NEXTAUTH_SECRET);
// set a fixed secret for the suite and make sure neither leaks in from the env.
beforeAll(() => {
  delete process.env.AUTH_SECRET;
  process.env.NEXTAUTH_SECRET = "test-secret-do-not-use-in-prod";
});

afterEach(() => {
  vi.useRealTimers();
});

describe("impersonation tokens", () => {
  it("round-trips a valid token back to its payload", () => {
    const token = createImpersonateToken("admin-1", "user-2");
    const payload = verifyImpersonateToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.adminId).toBe("admin-1");
    expect(payload?.targetUserId).toBe("user-2");
    expect(typeof payload?.nonce).toBe("string");
    expect(payload?.nonce.length).toBeGreaterThan(0);
  });

  it("issues a fresh nonce each time (single-use / replay defense)", () => {
    const a = verifyImpersonateToken(createImpersonateToken("admin", "user"));
    const b = verifyImpersonateToken(createImpersonateToken("admin", "user"));
    expect(a?.nonce).not.toBe(b?.nonce);
  });

  it("rejects a token whose signature was tampered with", () => {
    const token = createImpersonateToken("admin-1", "user-2");
    const [body] = token.split(".");
    const forged = `${body}.${"a".repeat(43)}`;
    expect(verifyImpersonateToken(forged)).toBeNull();
  });

  it("rejects a token whose payload was tampered with (sig no longer matches)", () => {
    const token = createImpersonateToken("admin-1", "user-2");
    const [, sig] = token.split(".");
    const forgedBody = Buffer.from(
      JSON.stringify({
        adminId: "attacker",
        targetUserId: "victim",
        exp: Date.now() + 60_000,
        nonce: "deadbeef",
      })
    ).toString("base64url");
    expect(verifyImpersonateToken(`${forgedBody}.${sig}`)).toBeNull();
  });

  it("signs with AUTH_SECRET when set (Auth.js v5's native name)", () => {
    // Regression: getSecret() used to read only NEXTAUTH_SECRET, so deployments
    // that set just AUTH_SECRET threw on every mint/verify and "Log in as" failed.
    process.env.AUTH_SECRET = "authjs-v5-secret";
    const token = createImpersonateToken("admin-1", "user-2");
    expect(verifyImpersonateToken(token)?.targetUserId).toBe("user-2");
    // A token signed under AUTH_SECRET must not verify under the fallback alone.
    delete process.env.AUTH_SECRET;
    expect(verifyImpersonateToken(token)).toBeNull();
  });

  it("rejects a token signed with a different secret", () => {
    process.env.NEXTAUTH_SECRET = "secret-A";
    const token = createImpersonateToken("admin-1", "user-2");
    process.env.NEXTAUTH_SECRET = "secret-B";
    expect(verifyImpersonateToken(token)).toBeNull();
    process.env.NEXTAUTH_SECRET = "test-secret-do-not-use-in-prod";
  });

  it("rejects an expired token", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const token = createImpersonateToken("admin-1", "user-2");
    // Jump past the 5-minute lifetime.
    vi.setSystemTime(new Date("2026-01-01T00:06:00Z"));
    expect(verifyImpersonateToken(token)).toBeNull();
  });

  it("accepts a token that is still within its lifetime", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const token = createImpersonateToken("admin-1", "user-2");
    vi.setSystemTime(new Date("2026-01-01T00:04:00Z"));
    expect(verifyImpersonateToken(token)?.adminId).toBe("admin-1");
  });

  it("rejects malformed tokens", () => {
    expect(verifyImpersonateToken("")).toBeNull();
    expect(verifyImpersonateToken("no-dot")).toBeNull();
    expect(verifyImpersonateToken("too.many.dots")).toBeNull();
    expect(verifyImpersonateToken("notbase64.notbase64")).toBeNull();
  });
});
