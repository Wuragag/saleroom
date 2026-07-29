import { describe, it, expect, vi, beforeEach } from "vitest";

// checkDealAccess mirrors checkPageAccess as the deal-layer ACL; the
// member/owner/teamless matrix is pinned the same way. DB + session mocked.

const { prismaMock, authMock } = vi.hoisted(() => ({
  prismaMock: {
    deal: { findUnique: vi.fn() },
    teamMember: { findUnique: vi.fn() },
  },
  authMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/auth", () => ({ auth: () => authMock() }));

import {
  accessibleDealWhere,
  canViewLinkedPage,
  checkDealAccess,
} from "@/lib/deal-auth";

const USER = "user-1";
const OTHER = "user-2";
const TEAM = "team-1";

function loginAs(id: string | null) {
  authMock.mockResolvedValue(id ? { user: { id } } : null);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("accessibleDealWhere", () => {
  it("scopes to the team when the user has one", () => {
    expect(accessibleDealWhere(USER, TEAM)).toEqual({ teamId: TEAM });
  });

  it("scopes to owned deals for teamless users", () => {
    expect(accessibleDealWhere(USER, null)).toEqual({ ownerId: USER });
  });
});

describe("canViewLinkedPage", () => {
  const page = (over = {}) => ({
    visibility: "TEAM",
    userId: USER,
    teamId: TEAM,
    ...over,
  });

  it("keeps PRIVATE pages creator-only", () => {
    expect(canViewLinkedPage(page({ visibility: "PRIVATE" }), USER, TEAM)).toBe(true);
    expect(canViewLinkedPage(page({ visibility: "PRIVATE" }), OTHER, TEAM)).toBe(false);
  });

  it("opens TEAM pages to members of the page's team only", () => {
    expect(canViewLinkedPage(page(), OTHER, TEAM)).toBe(true);
    expect(canViewLinkedPage(page(), OTHER, "team-2")).toBe(false);
    expect(canViewLinkedPage(page(), OTHER, null)).toBe(false);
  });

  it("treats legacy teamless pages as creator-only", () => {
    expect(canViewLinkedPage(page({ teamId: null }), USER, null)).toBe(true);
    expect(canViewLinkedPage(page({ teamId: null }), OTHER, TEAM)).toBe(false);
  });
});

describe("checkDealAccess", () => {
  const teamDeal = (over = {}) => ({
    ownerId: USER,
    teamId: TEAM,
    ...over,
  });

  it("denies when there is no session", async () => {
    loginAs(null);
    const res = await checkDealAccess("d", "view");
    expect(res.authorized).toBe(false);
    expect(res.reason).toBe("Unauthorized");
  });

  it("denies when the deal does not exist", async () => {
    loginAs(USER);
    prismaMock.deal.findUnique.mockResolvedValue(null);
    const res = await checkDealAccess("missing", "view");
    expect(res.authorized).toBe(false);
    expect(res.reason).toBe("Deal not found");
  });

  it("denies a non-member", async () => {
    loginAs(OTHER);
    prismaMock.deal.findUnique.mockResolvedValue(teamDeal());
    prismaMock.teamMember.findUnique.mockResolvedValue(null);
    const res = await checkDealAccess("d", "view");
    expect(res.authorized).toBe(false);
    expect(res.reason).toBe("Not a team member");
  });

  it("lets any member view and edit", async () => {
    loginAs(OTHER);
    prismaMock.deal.findUnique.mockResolvedValue(teamDeal());
    prismaMock.teamMember.findUnique.mockResolvedValue({ role: "MEMBER" });
    expect((await checkDealAccess("d", "view")).authorized).toBe(true);
    expect((await checkDealAccess("d", "edit")).authorized).toBe(true);
  });

  it("lets the deal owner delete", async () => {
    loginAs(USER);
    prismaMock.deal.findUnique.mockResolvedValue(teamDeal());
    prismaMock.teamMember.findUnique.mockResolvedValue({ role: "MEMBER" });
    expect((await checkDealAccess("d", "delete")).authorized).toBe(true);
  });

  it("lets a team OWNER delete a deal they do not own", async () => {
    loginAs(OTHER);
    prismaMock.deal.findUnique.mockResolvedValue(teamDeal());
    prismaMock.teamMember.findUnique.mockResolvedValue({ role: "OWNER" });
    expect((await checkDealAccess("d", "delete")).authorized).toBe(true);
  });

  it("blocks a plain member from deleting a deal they do not own", async () => {
    loginAs(OTHER);
    prismaMock.deal.findUnique.mockResolvedValue(teamDeal());
    prismaMock.teamMember.findUnique.mockResolvedValue({ role: "MEMBER" });
    const res = await checkDealAccess("d", "delete");
    expect(res.authorized).toBe(false);
    expect(res.reason).toBe("Only the deal owner or team owner can delete");
  });

  describe("teamless deals", () => {
    it("falls back to owner-only", async () => {
      loginAs(OTHER);
      prismaMock.deal.findUnique.mockResolvedValue(
        teamDeal({ teamId: null })
      );
      const res = await checkDealAccess("d", "view");
      expect(res.authorized).toBe(false);
      expect(res.reason).toBe("Forbidden");
      expect(prismaMock.teamMember.findUnique).not.toHaveBeenCalled();
    });

    it("allows the owner everything", async () => {
      loginAs(USER);
      prismaMock.deal.findUnique.mockResolvedValue(teamDeal({ teamId: null }));
      expect((await checkDealAccess("d", "delete")).authorized).toBe(true);
    });
  });
});
