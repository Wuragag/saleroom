import { describe, it, expect, vi, beforeEach } from "vitest";

// checkPageAccess is the centralized multi-tenant ACL — a bug here is a
// cross-tenant data leak, so the PRIVATE / TEAM / lock / owner matrix is worth
// pinning down. Both DB and session are mocked so the test is pure logic.

// vi.mock is hoisted above top-level consts, so build the mocks via vi.hoisted.
const { prismaMock, authMock } = vi.hoisted(() => ({
  prismaMock: {
    page: { findUnique: vi.fn() },
    teamMember: { findUnique: vi.fn() },
  },
  authMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/auth", () => ({ auth: () => authMock() }));

import { checkPageAccess } from "@/lib/team-auth";

const USER = "user-1";
const OTHER = "user-2";
const TEAM = "team-1";

function loginAs(id: string | null) {
  authMock.mockResolvedValue(id ? { user: { id } } : null);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("checkPageAccess", () => {
  it("denies when there is no session", async () => {
    loginAs(null);
    const res = await checkPageAccess("page-1", "view");
    expect(res.authorized).toBe(false);
    expect(res.reason).toBe("Unauthorized");
  });

  it("denies when the page does not exist", async () => {
    loginAs(USER);
    prismaMock.page.findUnique.mockResolvedValue(null);
    const res = await checkPageAccess("missing", "view");
    expect(res.authorized).toBe(false);
    expect(res.reason).toBe("Page not found");
  });

  describe("PRIVATE pages", () => {
    it("allows the creator", async () => {
      loginAs(USER);
      prismaMock.page.findUnique.mockResolvedValue({
        userId: USER,
        visibility: "PRIVATE",
      });
      expect((await checkPageAccess("p", "edit")).authorized).toBe(true);
    });

    it("denies a non-creator even on a team", async () => {
      loginAs(OTHER);
      prismaMock.page.findUnique.mockResolvedValue({
        userId: USER,
        visibility: "PRIVATE",
        teamId: TEAM,
      });
      const res = await checkPageAccess("p", "view");
      expect(res.authorized).toBe(false);
      expect(res.reason).toBe("This is a private page");
      // Private short-circuits before any team-membership lookup.
      expect(prismaMock.teamMember.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("TEAM pages", () => {
    const teamPage = (over = {}) => ({
      userId: USER,
      visibility: "TEAM",
      teamId: TEAM,
      lockedById: null,
      ...over,
    });

    it("denies a non-member", async () => {
      loginAs(OTHER);
      prismaMock.page.findUnique.mockResolvedValue(teamPage());
      prismaMock.teamMember.findUnique.mockResolvedValue(null);
      const res = await checkPageAccess("p", "view");
      expect(res.authorized).toBe(false);
      expect(res.reason).toBe("Not a team member");
    });

    it("lets any member view", async () => {
      loginAs(OTHER);
      prismaMock.page.findUnique.mockResolvedValue(teamPage());
      prismaMock.teamMember.findUnique.mockResolvedValue({ role: "MEMBER" });
      expect((await checkPageAccess("p", "view")).authorized).toBe(true);
    });

    it("lets a member edit an unlocked page", async () => {
      loginAs(OTHER);
      prismaMock.page.findUnique.mockResolvedValue(teamPage());
      prismaMock.teamMember.findUnique.mockResolvedValue({ role: "MEMBER" });
      expect((await checkPageAccess("p", "edit")).authorized).toBe(true);
    });

    it("blocks editing a page locked by someone else", async () => {
      loginAs(OTHER);
      prismaMock.page.findUnique.mockResolvedValue(
        teamPage({ lockedById: USER })
      );
      prismaMock.teamMember.findUnique.mockResolvedValue({ role: "MEMBER" });
      const res = await checkPageAccess("p", "edit");
      expect(res.authorized).toBe(false);
      expect(res.reason).toBe("Page is locked by another user");
    });

    it("allows the lock holder to edit their own locked page", async () => {
      loginAs(USER);
      prismaMock.page.findUnique.mockResolvedValue(
        teamPage({ lockedById: USER })
      );
      prismaMock.teamMember.findUnique.mockResolvedValue({ role: "MEMBER" });
      expect((await checkPageAccess("p", "edit")).authorized).toBe(true);
    });

    it("lets a non-owner creator delete their own page", async () => {
      loginAs(USER);
      prismaMock.page.findUnique.mockResolvedValue(teamPage());
      prismaMock.teamMember.findUnique.mockResolvedValue({ role: "MEMBER" });
      expect((await checkPageAccess("p", "delete")).authorized).toBe(true);
    });

    it("lets the team owner delete a page they did not create", async () => {
      loginAs(OTHER);
      prismaMock.page.findUnique.mockResolvedValue(teamPage());
      prismaMock.teamMember.findUnique.mockResolvedValue({ role: "OWNER" });
      expect((await checkPageAccess("p", "delete")).authorized).toBe(true);
    });

    it("blocks a plain member from deleting a page they did not create", async () => {
      loginAs(OTHER);
      prismaMock.page.findUnique.mockResolvedValue(teamPage());
      prismaMock.teamMember.findUnique.mockResolvedValue({ role: "MEMBER" });
      const res = await checkPageAccess("p", "delete");
      expect(res.authorized).toBe(false);
      expect(res.reason).toBe("Only the page creator or team owner can delete");
    });
  });

  describe("legacy pages with no team", () => {
    it("falls back to creator-only", async () => {
      loginAs(OTHER);
      prismaMock.page.findUnique.mockResolvedValue({
        userId: USER,
        visibility: "TEAM",
        teamId: null,
      });
      const res = await checkPageAccess("p", "view");
      expect(res.authorized).toBe(false);
      expect(res.reason).toBe("Forbidden");
    });
  });
});
