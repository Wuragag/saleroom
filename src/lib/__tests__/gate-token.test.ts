import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import {
  createGateToken,
  verifyGateToken,
  signIdentityAssertion,
  verifyIdentityAssertion,
  GATE_TOKEN_TTL_MS,
} from "@/lib/gate-token";

beforeAll(() => {
  delete process.env.AUTH_SECRET;
  process.env.NEXTAUTH_SECRET = "test-secret-do-not-use-in-prod";
});

afterEach(() => {
  vi.useRealTimers();
});

describe("gate magic-link tokens", () => {
  it("round-trips and normalises the email", () => {
    const token = createGateToken({
      pageId: "page_1",
      email: "  Jo@Acme.COM ",
      name: " Jo ",
      via: "ref_alice",
    });
    const payload = verifyGateToken(token);
    expect(payload).toMatchObject({
      pageId: "page_1",
      email: "jo@acme.com",
      name: "Jo",
      via: "ref_alice",
    });
    expect(payload?.exp).toBeGreaterThan(Date.now());
  });

  it("stores blanks as null", () => {
    const payload = verifyGateToken(createGateToken({ pageId: "p", email: "a@b.co", name: "  " }));
    expect(payload?.name).toBeNull();
    expect(payload?.via).toBeNull();
  });

  it("rejects a tampered payload", () => {
    const token = createGateToken({ pageId: "p", email: "a@b.co" });
    const [b64, sig] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ ...JSON.parse(Buffer.from(b64, "base64url").toString()), email: "x@evil.io" })
    ).toString("base64url");
    expect(verifyGateToken(`${forged}.${sig}`)).toBeNull();
  });

  it("rejects a bad signature and garbage", () => {
    const token = createGateToken({ pageId: "p", email: "a@b.co" });
    const [b64] = token.split(".");
    expect(verifyGateToken(`${b64}.AAAA`)).toBeNull();
    expect(verifyGateToken("nope")).toBeNull();
    expect(verifyGateToken("")).toBeNull();
    expect(verifyGateToken("a.b.c")).toBeNull();
  });

  it("expires after the TTL", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-17T10:00:00Z"));
    const token = createGateToken({ pageId: "p", email: "a@b.co" });
    vi.setSystemTime(new Date(Date.now() + GATE_TOKEN_TTL_MS - 1000));
    expect(verifyGateToken(token)).not.toBeNull();
    vi.setSystemTime(new Date(Date.now() + 2000));
    expect(verifyGateToken(token)).toBeNull();
  });

  it("is signed with the secret (a different secret cannot verify it)", () => {
    const token = createGateToken({ pageId: "p", email: "a@b.co" });
    const prev = process.env.NEXTAUTH_SECRET;
    process.env.NEXTAUTH_SECRET = "another-secret";
    try {
      expect(verifyGateToken(token)).toBeNull();
    } finally {
      process.env.NEXTAUTH_SECRET = prev;
    }
  });
});

describe("identity assertions", () => {
  it("verifies exactly the (page, token, source) it was issued for", () => {
    const proof = signIdentityAssertion("page_1", "tok_alice", "verified");
    expect(verifyIdentityAssertion("page_1", "tok_alice", "verified", proof)).toBe(true);
    // A forwarded-link holder knows the token but never held the cookie —
    // they can't upgrade the source, move it to another page, or swap tokens.
    expect(verifyIdentityAssertion("page_1", "tok_alice", "gate", proof)).toBe(false);
    expect(verifyIdentityAssertion("page_2", "tok_alice", "verified", proof)).toBe(false);
    expect(verifyIdentityAssertion("page_1", "tok_bob", "verified", proof)).toBe(false);
  });

  it("rejects missing or malformed proofs without throwing", () => {
    expect(verifyIdentityAssertion("p", "t", "link", undefined)).toBe(false);
    expect(verifyIdentityAssertion("p", "t", "link", null)).toBe(false);
    expect(verifyIdentityAssertion("p", "t", "link", "")).toBe(false);
    expect(verifyIdentityAssertion("p", "t", "link", "short")).toBe(false);
  });
});
