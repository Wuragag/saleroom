import { describe, it, expect, vi, beforeEach } from "vitest";

// The canonical Contacts book is fed by capture flows (room shares, email
// gates, stakeholder adds). The merge rules matter: auto-capture must never
// clobber a curated name/title, and the public gate must never break because
// of CRM bookkeeping. DB mocked so this stays pure logic.

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    contact: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    company: { findFirst: vi.fn(), create: vi.fn() },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import {
  companyScopeWhere,
  contactScopeWhere,
  resolveCompany,
  resolveCompanyInput,
  upsertContactFromActivity,
} from "@/lib/contacts";

const TEAM_SCOPE = { teamId: "team-1", userId: "user-1" };
const SOLO_SCOPE = { teamId: null, userId: "user-1" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("scope helpers", () => {
  it("scopes to the team when there is one, else the user", () => {
    expect(contactScopeWhere(TEAM_SCOPE)).toEqual({ teamId: "team-1" });
    expect(contactScopeWhere(SOLO_SCOPE)).toEqual({ userId: "user-1" });
    expect(companyScopeWhere(TEAM_SCOPE)).toEqual({ teamId: "team-1" });
    expect(companyScopeWhere(SOLO_SCOPE)).toEqual({ userId: "user-1" });
  });
});

describe("resolveCompany", () => {
  it("reuses an existing company by name", async () => {
    prismaMock.company.findFirst.mockResolvedValue({ id: "co-1" });
    expect(await resolveCompany(TEAM_SCOPE, "Acme Inc.")).toBe("co-1");
    expect(prismaMock.company.create).not.toHaveBeenCalled();
  });

  it("matches case-insensitively so casing variants don't fork the record", async () => {
    prismaMock.company.findFirst.mockResolvedValue({ id: "co-1" });
    expect(await resolveCompany(TEAM_SCOPE, "ACME inc.")).toBe("co-1");
    expect(prismaMock.company.findFirst).toHaveBeenCalledWith({
      where: {
        teamId: "team-1",
        name: { equals: "ACME inc.", mode: "insensitive" },
      },
      select: { id: true },
    });
    expect(prismaMock.company.create).not.toHaveBeenCalled();
  });

  it("rethrows non-unique DB errors instead of silently dropping the link", async () => {
    prismaMock.company.findFirst.mockResolvedValue(null);
    prismaMock.company.create.mockRejectedValue(new Error("connection reset"));
    await expect(resolveCompany(TEAM_SCOPE, "Acme")).rejects.toThrow("connection reset");
  });

  it("creates a company when the name is new, in the right scope", async () => {
    prismaMock.company.findFirst.mockResolvedValue(null);
    prismaMock.company.create.mockResolvedValue({ id: "co-new" });
    expect(await resolveCompany(TEAM_SCOPE, "  Globex  ")).toBe("co-new");
    expect(prismaMock.company.create).toHaveBeenCalledWith({
      data: { name: "Globex", teamId: "team-1", userId: null },
      select: { id: true },
    });
  });

  it("returns null for an empty name", async () => {
    expect(await resolveCompany(TEAM_SCOPE, "   ")).toBeNull();
    expect(prismaMock.company.findFirst).not.toHaveBeenCalled();
  });

  it("recovers from a concurrent create by fetching the winner", async () => {
    prismaMock.company.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "co-winner" });
    const p2002 = Object.assign(new Error("unique"), {
      name: "PrismaClientKnownRequestError",
      code: "P2002",
    });
    prismaMock.company.create.mockRejectedValue(p2002);
    expect(await resolveCompany(TEAM_SCOPE, "Acme")).toBe("co-winner");
  });
});

describe("resolveCompanyInput", () => {
  it("returns null when explicitly cleared", async () => {
    expect(await resolveCompanyInput(TEAM_SCOPE, null, undefined)).toBeNull();
  });

  it("rejects wrong-typed ids rather than silently unlinking", async () => {
    expect(await resolveCompanyInput(TEAM_SCOPE, 123, undefined)).toBe(false);
    expect(await resolveCompanyInput(TEAM_SCOPE, {}, undefined)).toBe(false);
    expect(await resolveCompanyInput(TEAM_SCOPE, "", undefined)).toBe(false);
  });

  it("rejects an id from another scope", async () => {
    prismaMock.company.findFirst.mockResolvedValue(null);
    expect(await resolveCompanyInput(TEAM_SCOPE, "co-foreign", undefined)).toBe(false);
  });

  it("accepts an in-scope id", async () => {
    prismaMock.company.findFirst.mockResolvedValue({ id: "co-1" });
    expect(await resolveCompanyInput(TEAM_SCOPE, "co-1", undefined)).toBe("co-1");
  });

  it("falls back to resolving a typed name", async () => {
    prismaMock.company.findFirst.mockResolvedValue({ id: "co-2" });
    expect(await resolveCompanyInput(TEAM_SCOPE, undefined, "Globex")).toBe("co-2");
  });

  it("treats a blank name as no company", async () => {
    expect(await resolveCompanyInput(TEAM_SCOPE, undefined, "  ")).toBeNull();
  });
});

describe("upsertContactFromActivity", () => {
  it("creates a new contact with a lowercased email", async () => {
    prismaMock.contact.findFirst.mockResolvedValue(null);
    await upsertContactFromActivity(TEAM_SCOPE, {
      email: "  Jane.Doe@ACME.com ",
      name: "Jane Doe",
      title: "CFO",
    });
    expect(prismaMock.contact.create).toHaveBeenCalledWith({
      data: {
        email: "jane.doe@acme.com",
        name: "Jane Doe",
        title: "CFO",
        companyId: null,
        teamId: "team-1",
        userId: null,
      },
    });
  });

  it("fills blanks on an existing contact", async () => {
    prismaMock.contact.findFirst.mockResolvedValue({
      id: "c-1",
      name: "",
      title: "",
      companyId: null,
    });
    prismaMock.company.findFirst.mockResolvedValue({ id: "co-1" }); // in scope
    await upsertContactFromActivity(TEAM_SCOPE, {
      email: "jane@acme.com",
      name: "Jane Doe",
      companyId: "co-1",
    });
    expect(prismaMock.contact.update).toHaveBeenCalledWith({
      where: { id: "c-1" },
      data: { name: "Jane Doe", company: { connect: { id: "co-1" } } },
    });
  });

  it("never overwrites a curated name, title, or company", async () => {
    prismaMock.contact.findFirst.mockResolvedValue({
      id: "c-1",
      name: "Jane Doe",
      title: "CFO",
      companyId: "co-existing",
    });
    await upsertContactFromActivity(TEAM_SCOPE, {
      email: "jane@acme.com",
      name: "jane",
      title: "unknown",
      companyId: "co-other",
    });
    expect(prismaMock.contact.update).not.toHaveBeenCalled();
  });

  it("ignores invalid emails without touching the DB", async () => {
    await upsertContactFromActivity(TEAM_SCOPE, { email: "not-an-email" });
    expect(prismaMock.contact.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.contact.create).not.toHaveBeenCalled();
  });

  it("swallows DB failures so capture flows never break", async () => {
    prismaMock.contact.findFirst.mockRejectedValue(new Error("db down"));
    await expect(
      upsertContactFromActivity(TEAM_SCOPE, { email: "jane@acme.com" })
    ).resolves.toBeUndefined();
  });

  it("ignores a companyId from another scope", async () => {
    prismaMock.contact.findFirst.mockResolvedValue(null);
    prismaMock.company.findFirst.mockResolvedValue(null); // not in scope
    await upsertContactFromActivity(TEAM_SCOPE, {
      email: "jane@acme.com",
      companyId: "co-foreign",
    });
    expect(prismaMock.contact.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ companyId: null }),
    });
  });

  it("resolves a companyName inside the fire-safe wrapper", async () => {
    prismaMock.contact.findFirst.mockResolvedValue(null);
    prismaMock.company.findFirst.mockResolvedValue({ id: "co-3" });
    await upsertContactFromActivity(TEAM_SCOPE, {
      email: "jane@acme.com",
      companyName: "Acme Inc.",
    });
    expect(prismaMock.contact.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ companyId: "co-3" }),
    });
  });

  it("stays fire-safe when the company lookup itself throws", async () => {
    prismaMock.company.findFirst.mockRejectedValue(new Error("db down"));
    await expect(
      upsertContactFromActivity(TEAM_SCOPE, {
        email: "jane@acme.com",
        companyName: "Acme",
      })
    ).resolves.toBeUndefined();
    expect(prismaMock.contact.create).not.toHaveBeenCalled();
  });

  it("writes teamless contacts against the user", async () => {
    prismaMock.contact.findFirst.mockResolvedValue(null);
    await upsertContactFromActivity(SOLO_SCOPE, { email: "solo@acme.com" });
    expect(prismaMock.contact.create).toHaveBeenCalledWith({
      data: {
        email: "solo@acme.com",
        name: "",
        title: "",
        companyId: null,
        teamId: null,
        userId: "user-1",
      },
    });
  });
});
