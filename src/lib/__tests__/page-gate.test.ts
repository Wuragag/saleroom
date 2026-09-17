import { describe, it, expect } from "vitest";
import {
  formatRefCookie,
  parseRefCookie,
  resolveIdentitySource,
  decideRefLinkGrant,
  normalizeDomains,
  emailMatchesDomains,
  isForwardedVisitor,
  isValidDomain,
  MAX_ALLOWED_DOMAINS,
} from "@/lib/page-gate";

describe("identity cookie encoding", () => {
  it("round-trips every source", () => {
    for (const source of ["link", "gate", "verified"] as const) {
      const parsed = parseRefCookie(formatRefCookie("abc123XYZ_-9", source));
      expect(parsed).toEqual({ token: "abc123XYZ_-9", source });
    }
  });

  it("treats a bare token as a personal-link claim (legacy cookies)", () => {
    expect(parseRefCookie("V1StGXR8_Z5j")).toEqual({ token: "V1StGXR8_Z5j", source: "link" });
  });

  it("rejects malformed values instead of guessing", () => {
    expect(parseRefCookie("")).toBeNull();
    expect(parseRefCookie(null)).toBeNull();
    expect(parseRefCookie(undefined)).toBeNull();
    expect(parseRefCookie(".g")).toBeNull();
    expect(parseRefCookie("tok.x")).toBeNull();
    expect(parseRefCookie("tok.g.v")).toBeNull();
  });
});

describe("resolveIdentitySource", () => {
  it("maps link and gate straight through", () => {
    expect(resolveIdentitySource("link", false)).toBe("LINK");
    expect(resolveIdentitySource("gate", false)).toBe("GATE");
  });

  it("only grants VERIFIED when the contact really is verified", () => {
    // The cookie source travels through the client; verifiedAt is the proof.
    expect(resolveIdentitySource("verified", true)).toBe("VERIFIED");
    expect(resolveIdentitySource("verified", false)).toBe("GATE");
  });
});

describe("decideRefLinkGrant", () => {
  const base = {
    viewerHasPageAccess: false,
    verifyEmail: false,
    requireEmail: false,
    alreadyClaimed: false,
  };

  it("lets the first browser on a link claim the identity", () => {
    expect(decideRefLinkGrant(base)).toBe("identity");
    expect(decideRefLinkGrant({ ...base, requireEmail: true })).toBe("identity");
  });

  it("downgrades later browsers on the same link to referrer only", () => {
    expect(decideRefLinkGrant({ ...base, alreadyClaimed: true })).toBe("referrer");
  });

  it("never grants identity from a link on a verify-email page", () => {
    expect(decideRefLinkGrant({ ...base, requireEmail: true, verifyEmail: true })).toBe("referrer");
  });

  it("ignores verifyEmail while the gate itself is off", () => {
    expect(decideRefLinkGrant({ ...base, verifyEmail: true })).toBe("identity");
  });

  it("tracks nothing for a teammate previewing the link", () => {
    expect(decideRefLinkGrant({ ...base, viewerHasPageAccess: true })).toBe("none");
    expect(
      decideRefLinkGrant({ ...base, viewerHasPageAccess: true, alreadyClaimed: true })
    ).toBe("none");
  });
});

describe("normalizeDomains", () => {
  it("accepts a pasted list in any common shape", () => {
    expect(normalizeDomains("Acme.com, @beta.io  https://gamma.co.uk/path;delta.org")).toEqual([
      "acme.com",
      "beta.io",
      "gamma.co.uk",
      "delta.org",
    ]);
    expect(normalizeDomains(["acme.com", "ACME.COM", ""])).toEqual(["acme.com"]);
  });

  it("drops things that are not domains", () => {
    expect(normalizeDomains("not a domain, foo, .com, -bad.com, ok.io")).toEqual(["ok.io"]);
    expect(normalizeDomains(null)).toEqual([]);
    expect(normalizeDomains(undefined)).toEqual([]);
  });

  it("caps the list", () => {
    const many = Array.from({ length: MAX_ALLOWED_DOMAINS + 5 }, (_, i) => `d${i}.com`);
    expect(normalizeDomains(many)).toHaveLength(MAX_ALLOWED_DOMAINS);
  });

  it("validates single domains", () => {
    expect(isValidDomain("acme.com")).toBe(true);
    expect(isValidDomain("a.b.c.d.io")).toBe(true);
    expect(isValidDomain("acme")).toBe(false);
    expect(isValidDomain("acme.c")).toBe(false);
    expect(isValidDomain("ac me.com")).toBe(false);
  });
});

describe("emailMatchesDomains", () => {
  it("allows everyone when the list is empty", () => {
    expect(emailMatchesDomains("anyone@anywhere.io", [])).toBe(true);
  });

  it("matches the domain and its sub-domains, case-insensitively", () => {
    const domains = ["acme.com"];
    expect(emailMatchesDomains("jo@acme.com", domains)).toBe(true);
    expect(emailMatchesDomains("jo@ACME.com", domains)).toBe(true);
    expect(emailMatchesDomains("jo@eu.acme.com", domains)).toBe(true);
  });

  it("does not match look-alikes", () => {
    const domains = ["acme.com"];
    expect(emailMatchesDomains("jo@notacme.com", domains)).toBe(false);
    expect(emailMatchesDomains("jo@acme.com.evil.io", domains)).toBe(false);
    expect(emailMatchesDomains("jo@acme.co", domains)).toBe(false);
    expect(emailMatchesDomains("acme.com", domains)).toBe(false);
  });
});

describe("isForwardedVisitor", () => {
  it("is false for the intended recipient and for anonymous direct visits", () => {
    expect(isForwardedVisitor({ contactId: "a", referredByContactId: "a" })).toBe(false);
    expect(isForwardedVisitor({ contactId: null, referredByContactId: null })).toBe(false);
    expect(isForwardedVisitor({ contactId: "a", referredByContactId: null })).toBe(false);
  });

  it("is true when the link owner and the identity differ, or identity is unknown", () => {
    expect(isForwardedVisitor({ contactId: "b", referredByContactId: "a" })).toBe(true);
    expect(isForwardedVisitor({ contactId: null, referredByContactId: "a" })).toBe(true);
  });
});
