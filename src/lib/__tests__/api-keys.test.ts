import { describe, it, expect, vi } from "vitest";

// The DB-backed authenticator lives in the same module; stub Prisma so the
// pure helpers can be imported without a database.
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { createHash } from "crypto";
import {
  API_KEY_DISPLAY_CHARS,
  API_KEY_PREFIX,
  generateApiKey,
  hashApiKey,
  looksLikeApiKey,
  parseBearerToken,
} from "@/lib/api-keys";

describe("generateApiKey", () => {
  it("mints a prefixed 160-bit hex secret with its hash and display prefix", () => {
    const key = generateApiKey();
    expect(key.token.startsWith(API_KEY_PREFIX)).toBe(true);
    expect(key.token).toMatch(/^dbk_[0-9a-f]{40}$/);
    expect(key.hash).toBe(createHash("sha256").update(key.token).digest("hex"));
    expect(key.prefix).toBe(key.token.slice(0, API_KEY_DISPLAY_CHARS));
    // The prefix must never leak enough of the secret to matter.
    expect(key.prefix.length).toBeLessThan(key.token.length / 3);
  });

  it("is random", () => {
    const a = generateApiKey();
    const b = generateApiKey();
    expect(a.token).not.toBe(b.token);
    expect(a.hash).not.toBe(b.hash);
  });
});

describe("hashApiKey", () => {
  it("is deterministic and one-way", () => {
    const { token } = generateApiKey();
    expect(hashApiKey(token)).toBe(hashApiKey(token));
    expect(hashApiKey(token)).not.toContain(token.slice(4, 20));
  });
});

describe("looksLikeApiKey", () => {
  it("accepts generated keys and rejects everything else", () => {
    expect(looksLikeApiKey(generateApiKey().token)).toBe(true);
    expect(looksLikeApiKey("")).toBe(false);
    expect(looksLikeApiKey("dbk_")).toBe(false);
    expect(looksLikeApiKey("dbk_" + "z".repeat(40))).toBe(false);
    expect(looksLikeApiKey("sk_" + "a".repeat(40))).toBe(false);
    expect(looksLikeApiKey("dbk_" + "a".repeat(39))).toBe(false);
    expect(looksLikeApiKey("dbk_" + "a".repeat(41))).toBe(false);
  });
});

describe("parseBearerToken", () => {
  it("extracts the credential from a Bearer header, case-insensitively", () => {
    expect(parseBearerToken("Bearer abc")).toBe("abc");
    expect(parseBearerToken("bearer abc")).toBe("abc");
    expect(parseBearerToken("  Bearer   abc  ")).toBe("abc");
  });

  it("returns null for missing, empty, or non-Bearer headers", () => {
    expect(parseBearerToken(null)).toBeNull();
    expect(parseBearerToken(undefined)).toBeNull();
    expect(parseBearerToken("")).toBeNull();
    expect(parseBearerToken("Bearer")).toBeNull();
    expect(parseBearerToken("Bearer   ")).toBeNull();
    expect(parseBearerToken("Basic abc")).toBeNull();
    expect(parseBearerToken("abc")).toBeNull();
  });
});
