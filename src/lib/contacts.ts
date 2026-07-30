import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

// Canonical Contact/Company upserts. Contacts auto-populate from activity the
// product already captures (room shares, email-gate signups, stakeholder
// adds); these helpers are additive and merge-safe — they never overwrite a
// real name/title with an empty one, and they never touch tracking tables.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The scope every canonical row lives in: a team, or a teamless user. */
export interface CrmScope {
  teamId: string | null;
  /** Used only when teamId is null. */
  userId: string;
}

export function contactScopeWhere(scope: CrmScope): Prisma.ContactWhereInput {
  return scope.teamId ? { teamId: scope.teamId } : { userId: scope.userId };
}

export function companyScopeWhere(scope: CrmScope): Prisma.CompanyWhereInput {
  return scope.teamId ? { teamId: scope.teamId } : { userId: scope.userId };
}

function scopeData(scope: CrmScope) {
  return scope.teamId
    ? { teamId: scope.teamId, userId: null }
    : { teamId: null, userId: scope.userId };
}

function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Error &&
    err.name === "PrismaClientKnownRequestError" &&
    (err as { code?: string }).code === "P2002"
  );
}

/**
 * Find-or-create a company by name within the scope. Matching is
 * case-insensitive so "Acme" typed twice with different casing joins one
 * company instead of quietly forking the record; race-safe via P2002.
 */
export async function resolveCompany(
  scope: CrmScope,
  name: string
): Promise<string | null> {
  const trimmed = name.trim().slice(0, 200);
  if (!trimmed) return null;
  const findExisting = () =>
    prisma.company.findFirst({
      where: {
        ...companyScopeWhere(scope),
        name: { equals: trimmed, mode: "insensitive" },
      },
      select: { id: true },
    });

  const existing = await findExisting();
  if (existing) return existing.id;
  try {
    const created = await prisma.company.create({
      data: { name: trimmed, ...scopeData(scope) },
      select: { id: true },
    });
    return created.id;
  } catch (err) {
    // Only a concurrent create is recoverable — anything else must surface.
    if (!isUniqueViolation(err)) throw err;
    const winner = await findExisting();
    return winner?.id ?? null;
  }
}

/**
 * Resolve a company from either an explicit in-scope id or a typed name, for
 * request bodies that accept both. Returns null for "no company", or false
 * when the input is invalid (caller turns that into a 400).
 */
export async function resolveCompanyInput(
  scope: CrmScope,
  companyId: unknown,
  companyName: unknown
): Promise<string | null | false> {
  if (companyId === null) return null;
  if (companyId !== undefined) {
    // Wrong-typed ids must 400, never silently unlink the company.
    if (typeof companyId !== "string" || !companyId) return false;
    const owned = await prisma.company.findFirst({
      where: { id: companyId, ...companyScopeWhere(scope) },
      select: { id: true },
    });
    return owned ? owned.id : false;
  }
  if (companyName === undefined || companyName === null) return null;
  if (typeof companyName !== "string") return false;
  const name = companyName.trim().slice(0, 200);
  if (!name) return null;
  return resolveCompany(scope, name);
}

export interface ContactActivity {
  email: string;
  name?: string | null;
  title?: string | null;
  /** Direct company link (e.g. the stakeholder's deal company). */
  companyId?: string | null;
  /** Company by name — resolved (and created) within the scope. */
  companyName?: string | null;
}

/**
 * Upsert a canonical contact from a capture flow. Fire-safe by design: it
 * swallows its own failures so the host route (including the public email
 * gate) never breaks because of CRM bookkeeping.
 */
export async function upsertContactFromActivity(
  scope: CrmScope,
  activity: ContactActivity
): Promise<void> {
  try {
    const email = activity.email.trim().toLowerCase().slice(0, 254);
    if (!EMAIL_RE.test(email)) return;
    const name = activity.name?.trim().slice(0, 120) ?? "";
    const title = activity.title?.trim().slice(0, 120) ?? "";

    // Verify any passed id belongs to this scope, or resolve a name — both
    // inside the fire-safe wrapper so callers can't crash on CRM bookkeeping.
    let companyId: string | null = null;
    if (activity.companyId) {
      const owned = await prisma.company.findFirst({
        where: { id: activity.companyId, ...companyScopeWhere(scope) },
        select: { id: true },
      });
      companyId = owned?.id ?? null;
    } else if (activity.companyName) {
      companyId = await resolveCompany(scope, activity.companyName);
    }

    const existing = await prisma.contact.findFirst({
      where: { ...contactScopeWhere(scope), email },
      select: { id: true, name: true, title: true, companyId: true },
    });

    if (!existing) {
      await prisma.contact.create({
        data: {
          email,
          name,
          title,
          companyId,
          ...scopeData(scope),
        },
      });
      return;
    }

    // Merge: fill blanks only, never clobber curated fields.
    const data: Prisma.ContactUpdateInput = {};
    if (name && !existing.name) data.name = name;
    if (title && !existing.title) data.title = title;
    if (companyId && !existing.companyId) {
      data.company = { connect: { id: companyId } };
    }
    if (Object.keys(data).length > 0) {
      await prisma.contact.update({ where: { id: existing.id }, data });
    }
  } catch (err) {
    // Duplicate create race is fine; anything else is logged, never thrown.
    console.error("[contacts] upsertContactFromActivity failed:", err);
  }
}
