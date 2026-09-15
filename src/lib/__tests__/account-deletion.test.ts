import { describe, expect, it } from "vitest"
import { isDeletionConfirmed, planAccountDeletion } from "../account-deletion"

describe("planAccountDeletion", () => {
  it("deletes a team the user is alone in, and cancels its subscription", () => {
    const plan = planAccountDeletion([
      { teamId: "t1", teamName: "Acme", role: "OWNER", memberCount: 1, stripeSubscriptionId: "sub_1" },
    ])
    expect(plan).toEqual({ ok: true, deleteTeamIds: ["t1"], leaveTeamIds: [], cancelStripeSubscriptionIds: ["sub_1"] })
  })

  it("lets a member leave a shared team without touching it", () => {
    const plan = planAccountDeletion([
      { teamId: "t1", teamName: "Acme", role: "MEMBER", memberCount: 4, stripeSubscriptionId: "sub_1" },
    ])
    expect(plan).toEqual({ ok: true, deleteTeamIds: [], leaveTeamIds: ["t1"], cancelStripeSubscriptionIds: [] })
  })

  it("refuses when the user owns a team that still has other members", () => {
    const plan = planAccountDeletion([
      { teamId: "t1", teamName: "Acme", role: "OWNER", memberCount: 3 },
      { teamId: "t2", teamName: "Side", role: "OWNER", memberCount: 1 },
    ])
    expect(plan).toEqual({ ok: false, code: "OWNER_OF_SHARED_TEAM", teamNames: ["Acme"] })
  })

  it("handles a user with no team at all", () => {
    expect(planAccountDeletion([])).toEqual({ ok: true, deleteTeamIds: [], leaveTeamIds: [], cancelStripeSubscriptionIds: [] })
  })
})

describe("isDeletionConfirmed", () => {
  it("requires the exact phrase", () => {
    expect(isDeletionConfirmed("DELETE")).toBe(true)
    expect(isDeletionConfirmed(" DELETE ")).toBe(true)
    expect(isDeletionConfirmed("delete")).toBe(false)
    expect(isDeletionConfirmed(undefined)).toBe(false)
  })
})
