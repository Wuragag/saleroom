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
    prismaMock.company.create.mockRejectedValue(new Error("unique violation"));
    expect(await resolveCompany(TEAM_SCOPE, "Acme")).toBe("co-winner");
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
