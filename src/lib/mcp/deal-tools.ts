/**
 * Deal / pipeline tools plus the contacts & companies book. Reads reuse the
 * app's query layer (listDealsWithRollups, getDealDetail, listContacts,
 * listCompanies) so engagement rollups and intent labels match the UI
 * exactly. Writes mirror the validation in /api/deals and /api/deals/[id]
 * (ownership reassignment is deliberately not exposed here).
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { prisma } from "@/lib/prisma";
import { checkDealAccessFor } from "@/lib/deal-auth";
import { checkPageAccessFor } from "@/lib/team-auth";
import { listDealsWithRollups, getDealDetail } from "@/lib/deal-queries";
import { listContacts, listCompanies } from "@/lib/contact-queries";
import { filterDeals } from "@/lib/deals";
import { ensurePipelineStages } from "@/lib/pipeline-stages";
import { resolveCompany, upsertContactFromActivity } from "@/lib/contacts";
import {
  assertCanCreateDealTx,
  dealLockKey,
  withResourceLock,
} from "@/lib/plan-limits";
import type { DealStatus, Prisma } from "@/generated/prisma";
import { ok, fail, guard, denied, dealUrl, iso, type McpPrincipal } from "./util";

const DEAL_VALUE_MAX = 2_000_000_000;

/** Accepts a stage id or a (case-insensitive) stage name from the scope. */
async function resolveStage(
  p: McpPrincipal,
  stage: string,
  scope: { teamId: string | null; userId: string }
) {
  const stages = await ensurePipelineStages(scope.userId, scope.teamId);
  const lowered = stage.trim().toLowerCase();
  return (
    stages.find((s) => s.id === stage) ??
    stages.find((s) => s.name.toLowerCase() === lowered) ??
    null
  );
}

function parseDate(value: string | undefined | null): Date | null | "invalid" {
  if (value === undefined || value === null || value === "") return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? "invalid" : d;
}

export function registerDealTools(server: McpServer, p: McpPrincipal) {
  // ── Reads ──────────────────────────────────────────────────────────────

  server.registerTool(
    "list_deals",
    {
      title: "List deals",
      description:
        "Your team's pipeline with per-deal buyer engagement (intent: High " +
        "Intent / Warm / Cold, last activity). Filters match the pipeline " +
        "toolbar: text query on name/company, status, stage, owner, warmth, " +
        "close-date bucket.",
      inputSchema: {
        query: z.string().optional(),
        status: z.enum(["OPEN", "WON", "LOST"]).optional(),
        stage: z.string().optional().describe("Stage id or name"),
        ownerId: z.string().optional(),
        warmth: z.enum(["high", "warm", "cold", "none"]).optional(),
        closeDate: z.enum(["overdue", "soon", "none"]).optional()
          .describe("overdue | soon (next 30 days) | none (no date)"),
        limit: z.number().int().min(1).max(200).optional().describe("Default 50"),
      },
      annotations: { readOnlyHint: true },
    },
    guard(async ({ query, status, stage, ownerId, warmth, closeDate, limit }) => {
      let stageId: string | null = null;
      if (stage) {
        const resolved = await resolveStage(p, stage, { teamId: p.teamId, userId: p.userId });
        if (!resolved) return fail(`Unknown stage "${stage}". See get_workspace for stages.`);
        stageId = resolved.id;
      }
      const all = await listDealsWithRollups(p.userId, p.teamId);
      const matching = filterDeals(all, {
        query,
        status: status ?? null,
        stageId,
        ownerId: ownerId ?? null,
        warmth: warmth ?? null,
        closeDate: closeDate ?? null,
      });
      // Totals describe every match; only the listing is truncated.
      const openValue = matching
        .filter((d) => d.status === "OPEN")
        .reduce((sum, d) => sum + (d.value ?? 0), 0);
      const deals = matching.slice(0, limit ?? 50);

      return ok({
        totalMatching: matching.length,
        returned: deals.length,
        openValue,
        deals: deals.map((d) => ({
          id: d.id,
          name: d.name,
          url: dealUrl(p.appUrl, d.id),
          company: d.company?.name ?? null,
          value: d.value,
          stage: d.stage.name,
          stageId: d.stage.id,
          stageEnteredAt: d.stageEnteredAt,
          status: d.status,
          expectedCloseDate: d.expectedCloseDate,
          closedAt: d.closedAt,
          owner: { id: d.owner.id, name: [d.owner.name, d.owner.lastName].filter(Boolean).join(" ") },
          pages: d.pages,
          stakeholderCount: d.stakeholderCount,
          engagement: d.engagement,
          updatedAt: d.updatedAt,
        })),
      });
    })
  );

  server.registerTool(
    "get_deal",
    {
      title: "Get deal",
      description:
        "One deal in full: fields, linked pages with per-page engagement, " +
        "stakeholders (with their own engagement), suggested stakeholders from " +
        "page contacts, action-plan summaries, and team comments.",
      inputSchema: { dealId: z.string() },
      annotations: { readOnlyHint: true },
    },
    guard(async ({ dealId }) => {
      const access = await checkDealAccessFor(p.userId, dealId, "view");
      if (!access.authorized) return denied(access.reason);
      const deal = await getDealDetail(dealId, p.userId, p.teamId);
      if (!deal) return fail("Deal not found");
      return ok({ ...deal, url: dealUrl(p.appUrl, deal.id) });
    })
  );

  server.registerTool(
    "list_contacts",
    {
      title: "List contacts",
      description:
        "Buyer-side people your team has interacted with (shared pages, email " +
        "gates, stakeholders), with last activity and intent.",
      inputSchema: {
        query: z.string().optional().describe("Match on name, email or company"),
        limit: z.number().int().min(1).max(500).optional().describe("Default 100"),
      },
      annotations: { readOnlyHint: true },
    },
    guard(async ({ query, limit }) => {
      const rows = await listContacts(p.userId, p.teamId);
      const q = query?.trim().toLowerCase();
      const filtered = q
        ? rows.filter(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              c.email.toLowerCase().includes(q) ||
              (c.company?.name ?? "").toLowerCase().includes(q)
          )
        : rows;
      return ok({ contacts: filtered.slice(0, limit ?? 100) });
    })
  );

  server.registerTool(
    "list_companies",
    {
      title: "List companies",
      description:
        "Buyer companies with contact/deal counts, open pipeline value and warmth.",
      inputSchema: {
        query: z.string().optional(),
        limit: z.number().int().min(1).max(500).optional().describe("Default 100"),
      },
      annotations: { readOnlyHint: true },
    },
    guard(async ({ query, limit }) => {
      const rows = await listCompanies(p.userId, p.teamId);
      const q = query?.trim().toLowerCase();
      const filtered = q ? rows.filter((c) => c.name.toLowerCase().includes(q)) : rows;
      return ok({ companies: filtered.slice(0, limit ?? 100) });
    })
  );

  // ── Writes ─────────────────────────────────────────────────────────────

  server.registerTool(
    "create_deal",
    {
      title: "Create deal",
      description:
        "Add a deal to the pipeline (owner = you). Stage defaults to the first " +
        "column; a company name is matched to or creates a Company. Optionally " +
        "link an existing page.",
      inputSchema: {
        name: z.string().min(1).max(200),
        company: z.string().max(200).optional(),
        value: z.number().min(0).max(DEAL_VALUE_MAX).optional().describe("Whole USD"),
        stage: z.string().optional().describe("Stage id or name"),
        expectedCloseDate: z.string().optional().describe("ISO date"),
        pageId: z.string().optional().describe("Link this page to the new deal"),
      },
    },
    guard(async ({ name, company, value, stage, expectedCloseDate, pageId }) => {
      const close = parseDate(expectedCloseDate);
      if (close === "invalid") return fail("Invalid expectedCloseDate");

      const scope = { teamId: p.teamId, userId: p.userId };
      const stages = await ensurePipelineStages(p.userId, p.teamId);
      let stageId = stages[0]?.id;
      if (stage) {
        const resolved = await resolveStage(p, stage, scope);
        if (!resolved) return fail(`Unknown stage "${stage}". See get_workspace for stages.`);
        stageId = resolved.id;
      }
      if (!stageId) return fail("No pipeline columns exist");

      if (pageId) {
        const pageAccess = await checkPageAccessFor(p.userId, pageId, "edit");
        if (!pageAccess.authorized) return denied(pageAccess.reason);
        if (pageAccess.page.dealId) return fail("This page is already linked to a deal");
      }

      const companyId = company?.trim() ? await resolveCompany(scope, company.trim()) : null;

      const deal = await withResourceLock(dealLockKey(p.teamId, p.userId), async (tx) => {
        await assertCanCreateDealTx(tx, p.teamId, p.userId);
        const created = await tx.deal.create({
          data: {
            name: name.trim(),
            companyId,
            value: value === undefined ? null : Math.round(value),
            stageId: stageId!,
            expectedCloseDate: close,
            ownerId: p.userId,
            teamId: p.teamId,
          },
          include: { stage: { select: { id: true, name: true } }, company: { select: { name: true } } },
        });
        if (pageId) {
          // dealId-null guard closes the race with a concurrent link.
          const linked = await tx.page.updateMany({
            where: { id: pageId, dealId: null },
            data: { dealId: created.id },
          });
          if (linked.count === 0) throw new Error("PAGE_ALREADY_LINKED");
        }
        return created;
      }).catch((err) => {
        if (err instanceof Error && err.message === "PAGE_ALREADY_LINKED") return null;
        throw err;
      });
      if (!deal) return fail("This page is already linked to a deal");

      return ok(
        {
          id: deal.id,
          url: dealUrl(p.appUrl, deal.id),
          name: deal.name,
          company: deal.company?.name ?? null,
          value: deal.value,
          stage: deal.stage.name,
          stageId: deal.stage.id,
          status: deal.status,
          expectedCloseDate: iso(deal.expectedCloseDate),
          linkedPageId: pageId ?? null,
        },
        `Created deal "${deal.name}".`
      );
    })
  );

  server.registerTool(
    "update_deal",
    {
      title: "Update deal",
      description:
        "Edit a deal: rename, set company/value/close date, move it to another " +
        "stage, or mark it WON / LOST / OPEN (reopening re-checks the plan's " +
        "open-deal cap). Ownership changes are only available in the app.",
      inputSchema: {
        dealId: z.string(),
        name: z.string().min(1).max(200).optional(),
        company: z.string().max(200).optional().describe("Empty string unlinks the company"),
        value: z.number().min(0).max(DEAL_VALUE_MAX).nullable().optional(),
        stage: z.string().optional().describe("Stage id or name"),
        status: z.enum(["OPEN", "WON", "LOST"]).optional(),
        expectedCloseDate: z.string().nullable().optional().describe("ISO date, or null to clear"),
      },
    },
    guard(async ({ dealId, name, company, value, stage, status, expectedCloseDate }) => {
      const access = await checkDealAccessFor(p.userId, dealId, "edit");
      if (!access.authorized) return denied(access.reason);
      const deal = access.deal as {
        id: string; teamId: string | null; ownerId: string; stageId: string; status: DealStatus;
      };

      const data: Prisma.DealUpdateInput = {};
      if (name !== undefined) data.name = name.trim();

      if (company !== undefined) {
        const trimmed = company.trim();
        if (!trimmed) {
          data.company = { disconnect: true };
        } else {
          const companyId = await resolveCompany(
            { teamId: deal.teamId, userId: deal.ownerId },
            trimmed
          );
          data.company = companyId ? { connect: { id: companyId } } : { disconnect: true };
        }
      }

      if (value !== undefined) data.value = value === null ? null : Math.round(value);

      if (stage !== undefined) {
        // The stage must belong to the deal's scope (its team, or its teamless owner).
        const resolved = await resolveStage(p, stage, { teamId: deal.teamId, userId: deal.ownerId });
        if (!resolved) return fail(`Unknown stage "${stage}". See get_workspace for stages.`);
        if (resolved.id !== deal.stageId) {
          data.stage = { connect: { id: resolved.id } };
          data.stageEnteredAt = new Date();
        }
      }

      if (status !== undefined && status !== deal.status) {
        data.status = status;
        data.closedAt = status === "OPEN" ? null : new Date();
        if (status === "OPEN") data.stageEnteredAt = new Date();
      }

      if (expectedCloseDate !== undefined) {
        const close = parseDate(expectedCloseDate);
        if (close === "invalid") return fail("Invalid expectedCloseDate");
        data.expectedCloseDate = close;
      }

      if (Object.keys(data).length === 0) return fail("Nothing to update.");

      const include = {
        stage: { select: { id: true, name: true } },
        company: { select: { name: true } },
      } as const;
      // Reopening puts the deal back in the open-pipeline count, so it re-checks
      // the plan cap under the same advisory lock as create.
      const updated =
        data.status === "OPEN"
          ? await withResourceLock(dealLockKey(deal.teamId, deal.ownerId), async (tx) => {
              await assertCanCreateDealTx(tx, deal.teamId, deal.ownerId);
              return tx.deal.update({ where: { id: dealId }, data, include });
            })
          : await prisma.deal.update({ where: { id: dealId }, data, include });

      return ok({
        id: updated.id,
        url: dealUrl(p.appUrl, updated.id),
        name: updated.name,
        company: updated.company?.name ?? null,
        value: updated.value,
        stage: updated.stage.name,
        stageId: updated.stage.id,
        status: updated.status,
        expectedCloseDate: iso(updated.expectedCloseDate),
        closedAt: iso(updated.closedAt),
      });
    })
  );

  server.registerTool(
    "add_deal_comment",
    {
      title: "Add deal comment",
      description: "Post a team-only note on a deal (never visible to buyers).",
      inputSchema: { dealId: z.string(), body: z.string().min(1).max(2000) },
    },
    guard(async ({ dealId, body }) => {
      const access = await checkDealAccessFor(p.userId, dealId, "view");
      if (!access.authorized) return denied(access.reason);
      const comment = await prisma.dealComment.create({
        data: { dealId, authorId: p.userId, body: body.trim() },
      });
      return ok({ id: comment.id, createdAt: iso(comment.createdAt) });
    })
  );

  server.registerTool(
    "add_stakeholder",
    {
      title: "Add stakeholder",
      description:
        "Add a buyer-side person to a deal (unique per deal + email). Their " +
        "engagement on linked pages is matched by email.",
      inputSchema: {
        dealId: z.string(),
        email: z.string().email().max(254),
        name: z.string().max(120).optional(),
        title: z.string().max(120).optional(),
      },
    },
    guard(async ({ dealId, email, name, title }) => {
      const access = await checkDealAccessFor(p.userId, dealId, "edit");
      if (!access.authorized) return denied(access.reason);
      const deal = access.deal as { teamId: string | null; ownerId: string; companyId: string | null };
      const normalized = email.trim().toLowerCase();
      const stakeholder = await prisma.dealStakeholder.create({
        data: { dealId, email: normalized, name: name?.trim() ?? "", title: title?.trim() ?? "" },
      });
      await upsertContactFromActivity(
        { teamId: deal.teamId, userId: deal.ownerId },
        { email: normalized, name: name ?? "", title: title ?? "", companyId: deal.companyId }
      );
      return ok({
        id: stakeholder.id,
        email: stakeholder.email,
        name: stakeholder.name,
        title: stakeholder.title,
      });
    })
  );

  server.registerTool(
    "link_page_to_deal",
    {
      title: "Link page to deal",
      description:
        "Attach an existing page to a deal so its buyer engagement rolls up into " +
        "the deal. A page belongs to at most one deal.",
      inputSchema: { dealId: z.string(), pageId: z.string() },
    },
    guard(async ({ dealId, pageId }) => {
      const access = await checkDealAccessFor(p.userId, dealId, "edit");
      if (!access.authorized) return denied(access.reason);
      const pageAccess = await checkPageAccessFor(p.userId, pageId, "edit");
      if (!pageAccess.authorized) return denied(pageAccess.reason);

      // dealId guard makes the link atomic; already-linked-here is idempotent.
      const linked = await prisma.page.updateMany({
        where: { id: pageId, OR: [{ dealId: null }, { dealId }] },
        data: { dealId },
      });
      if (linked.count === 0) return fail("This page is already linked to another deal");
      return ok({ dealId, pageId, linked: true });
    })
  );
}
