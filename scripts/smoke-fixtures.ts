/**
 * Shared identifiers for the CI smoke fixtures.
 *
 * Kept in its own module so scripts/smoke-test.ts can read the slug prefix
 * without importing scripts/smoke-seed.ts, which seeds on import.
 */
export const SMOKE_SLUG_PREFIX = "smoke-";
export const SMOKE_USER_ID = "smoke-user-001";
export const SMOKE_TEAM_ID = "smoke-team-001";
