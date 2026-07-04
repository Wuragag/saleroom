import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the DB singleton and the generated Prisma value import so the module
// loads without a real client. Only `getTeamPlan` reads the DB here; the
// atomic *Tx asserts take an injected `tx`, which we hand-mock per test.
// vi.mock is hoisted above top-level consts, so build the mock via vi.hoisted.
const { prismaMock } = vi.hoisted(() => ({
  prismaMock: { subscription: { findUnique: vi.fn() } },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/generated/prisma", () => ({ Prisma: {} }));

import {
  PLAN_LIMITS,
  PlanLimitError,
  pageLockKey,
  getTeamPlan,
  assertCanCreatePageTx,
  assertCanCreateTabsTx,
  assertCanAddTeamMemberTx,
  assertCanCreateSyncedBlockTx,
} from "@/lib/plan-limits";

beforeEach(() => vi.clearAllMocks());

describe("PLAN_LIMITS invariants", () => {
  it("FREE is the most restrictive tier", () => {
    expect(PLAN_LIMITS.FREE.maxPages).toBe(1);
    expect(PLAN_LIMITS.FREE.passwordProtection).toBe(false);
    expect(PLAN_LIMITS.FREE.canInvite).toBe(false);
    expect(PLAN_LIMITS.FREE.maxSyncedBlocks).toBe(0);
  });

  it("PRO and TEAM unlock unlimited pages (-1)", () => {
    expect(PLAN_LIMITS.PRO.maxPages).toBe(-1);
    expect(PLAN_LIMITS.TEAM.maxPages).toBe(-1);
  });

  it("paid tiers enable password protection and invites", () => {
    for (const plan of ["PRO", "TEAM"] as const) {
      expect(PLAN_LIMITS[plan].passwordProtection).toBe(true);
      expect(PLAN_LIMITS[plan].canInvite).toBe(true);
    }
  });

  it("AI credit pools increase strictly with tier", () => {
    expect(PLAN_LIMITS.FREE.aiCreditsPerMonth).toBeLessThan(
      PLAN_LIMITS.PRO.aiCreditsPerMonth
    );
    expect(PLAN_LIMITS.PRO.aiCreditsPerMonth).toBeLessThan(
      PLAN_LIMITS.TEAM.aiCreditsPerMonth
    );
  });
});

describe("pageLockKey", () => {
  it("keys on team when present, else on user", () => {
    expect(pageLockKey("t1", "u1")).toBe("team:t1:pages");
    expect(pageLockKey(null, "u1")).toBe("user:u1:pages");
  });

  it("gives different teams different lock keys (no cross-team serialization)", () => {
    expect(pageLockKey("t1", "u1")).not.toBe(pageLockKey("t2", "u1"));
  });
});

describe("getTeamPlan", () => {
  it("returns the plan for an ACTIVE subscription", async () => {
    prismaMock.subscription.findUnique.mockResolvedValue({
      plan: "PRO",
      status: "ACTIVE",
    });
    expect(await getTeamPlan("t1")).toBe("PRO");
  });

  it("counts TRIALING as paid", async () => {
    prismaMock.subscription.findUnique.mockResolvedValue({
      plan: "TEAM",
      status: "TRIALING",
    });
    expect(await getTeamPlan("t1")).toBe("TEAM");
  });

  it("falls back to FREE for a canceled/past-due subscription", async () => {
    prismaMock.subscription.findUnique.mockResolvedValue({
      plan: "PRO",
      status: "CANCELED",
    });
    expect(await getTeamPlan("t1")).toBe("FREE");
  });

  it("falls back to FREE when there is no subscription", async () => {
    prismaMock.subscription.findUnique.mockResolvedValue(null);
    expect(await getTeamPlan("t1")).toBe("FREE");
  });
});

describe("assertCanCreatePageTx", () => {
  // The plan is resolved via the global prisma singleton (getTeamPlan); only the
  // resource count runs on the injected tx. So we stub the plan on prismaMock
  // and the count on tx.
  const setPlan = (plan = "FREE", status = "ACTIVE") =>
    prismaMock.subscription.findUnique.mockResolvedValue({ plan, status });
  const txWith = (count: number) => ({
    page: { count: vi.fn().mockResolvedValue(count) },
  });

  it("throws PlanLimitError when a FREE team is at its 1-page cap", async () => {
    setPlan("FREE");
    const tx = txWith(1);
    await expect(
      assertCanCreatePageTx(tx as never, "t1", "u1")
    ).rejects.toBeInstanceOf(PlanLimitError);
  });

  it("allows a FREE team under the cap", async () => {
    setPlan("FREE");
    const tx = txWith(0);
    await expect(
      assertCanCreatePageTx(tx as never, "t1", "u1")
    ).resolves.toBeUndefined();
  });

  it("never blocks an unlimited (PRO) team", async () => {
    setPlan("PRO");
    const tx = txWith(9999);
    await expect(
      assertCanCreatePageTx(tx as never, "t1", "u1")
    ).resolves.toBeUndefined();
    // Unlimited plans skip the count query entirely.
    expect(tx.page.count).not.toHaveBeenCalled();
  });

  it("applies the FREE cap to teamless users counted on their own pages", async () => {
    const tx = {
      // teamId === null → no subscription lookup, FREE cap used directly.
      page: { count: vi.fn().mockResolvedValue(1) },
    };
    await expect(
      assertCanCreatePageTx(tx as never, null, "u1")
    ).rejects.toBeInstanceOf(PlanLimitError);
    expect(tx.page.count).toHaveBeenCalledWith({ where: { userId: "u1" } });
  });
});

describe("assertCanCreateTabsTx", () => {
  it("is a no-op for teamless pages (page cap already bounds them)", async () => {
    const tx = { tab: { count: vi.fn() } };
    await expect(
      assertCanCreateTabsTx(tx as never, "p1", null, 5)
    ).resolves.toBeUndefined();
    expect(tx.tab.count).not.toHaveBeenCalled();
  });

  it("rejects when the batch would push a FREE page over 3 tabs", async () => {
    prismaMock.subscription.findUnique.mockResolvedValue({
      plan: "FREE",
      status: "ACTIVE",
    });
    const tx = { tab: { count: vi.fn().mockResolvedValue(2) } };
    // 2 existing + 2 new = 4 > 3
    await expect(
      assertCanCreateTabsTx(tx as never, "p1", "t1", 2)
    ).rejects.toBeInstanceOf(PlanLimitError);
  });

  it("allows a batch that lands exactly on the cap", async () => {
    prismaMock.subscription.findUnique.mockResolvedValue({
      plan: "FREE",
      status: "ACTIVE",
    });
    const tx = { tab: { count: vi.fn().mockResolvedValue(1) } };
    // 1 existing + 2 new = 3 === 3
    await expect(
      assertCanCreateTabsTx(tx as never, "p1", "t1", 2)
    ).resolves.toBeUndefined();
  });
});

describe("assertCanAddTeamMemberTx", () => {
  it("counts pending invites against the seat cap", async () => {
    prismaMock.subscription.findUnique.mockResolvedValue({
      plan: "PRO",
      status: "ACTIVE",
    });
    const tx = {
      teamMember: { count: vi.fn().mockResolvedValue(2) },
      teamInvite: { count: vi.fn().mockResolvedValue(1) },
    };
    // 2 members + 1 pending invite = 3 === PRO cap of 3 → blocked
    await expect(
      assertCanAddTeamMemberTx(tx as never, "t1")
    ).rejects.toBeInstanceOf(PlanLimitError);
  });
});

describe("assertCanCreateSyncedBlockTx", () => {
  it("blocks synced blocks entirely on FREE (cap 0)", async () => {
    prismaMock.subscription.findUnique.mockResolvedValue({
      plan: "FREE",
      status: "ACTIVE",
    });
    const tx = { syncedBlock: { count: vi.fn() } };
    await expect(
      assertCanCreateSyncedBlockTx(tx as never, "t1")
    ).rejects.toBeInstanceOf(PlanLimitError);
    // Never even counts — the tier disallows the feature.
    expect(tx.syncedBlock.count).not.toHaveBeenCalled();
  });
});
