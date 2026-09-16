/**
 * Account-deletion rules (GDPR Art. 17 / KVKK Art. 7 / CCPA §1798.105).
 *
 * Pure decision logic, kept out of the route so it is unit-testable. The
 * route gathers the user's memberships and applies the plan inside one
 * transaction.
 *
 * Rules:
 * - A team where the user is the only member is deleted with the user
 *   (pages, deals, contacts, brand kit, subscription rows cascade).
 * - A team with other members where the user is a MEMBER: the user leaves;
 *   the team survives. Their own pages are deleted with them (pages cascade
 *   from User), which the UI states plainly before confirming.
 * - A team with other members where the user is an OWNER: deletion is
 *   refused until ownership is transferred or the other members removed —
 *   otherwise a live team would be left ownerless.
 */

export type TeamRole = "OWNER" | "MEMBER"

export interface MembershipSummary {
  teamId: string
  teamName: string
  role: TeamRole
  /** Total members in the team, including this user. */
  memberCount: number
  /** Stripe subscription id, if the team is on a paid plan. */
  stripeSubscriptionId?: string | null
}

export type DeletionPlan =
  | {
      ok: true
      /** Teams to delete outright (sole member). */
      deleteTeamIds: string[]
      /** Teams to leave (other members remain). */
      leaveTeamIds: string[]
      /** Subscriptions to cancel at Stripe before the rows cascade away. */
      cancelStripeSubscriptionIds: string[]
    }
  | { ok: false; code: "OWNER_OF_SHARED_TEAM"; teamNames: string[] }

export function planAccountDeletion(memberships: MembershipSummary[]): DeletionPlan {
  const blocking = memberships.filter((m) => m.role === "OWNER" && m.memberCount > 1)
  if (blocking.length > 0) {
    return { ok: false, code: "OWNER_OF_SHARED_TEAM", teamNames: blocking.map((m) => m.teamName) }
  }
  const sole = memberships.filter((m) => m.memberCount <= 1)
  const shared = memberships.filter((m) => m.memberCount > 1)
  return {
    ok: true,
    deleteTeamIds: sole.map((m) => m.teamId),
    leaveTeamIds: shared.map((m) => m.teamId),
    cancelStripeSubscriptionIds: sole.map((m) => m.stripeSubscriptionId).filter((s): s is string => !!s),
  }
}

/** The confirmation phrase a user must type; compared case-sensitively after trim. */
export const DELETE_CONFIRMATION = "DELETE"

export function isDeletionConfirmed(input: unknown): boolean {
  return typeof input === "string" && input.trim() === DELETE_CONFIRMATION
}
