/**
 * Orientation + cross-cutting read tools: who am I, what's my team/plan,
 * what happened recently, which templates exist.
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, getTeamPlan } from "@/lib/plan-limits";
import { ensurePipelineStages } from "@/lib/pipeline-stages";
import { accessiblePageWhere } from "@/lib/team-auth";
import { accessibleDealWhere } from "@/lib/deal-auth";
import { listWorkspaceActivity, ACTIVITY_MAX_LIMIT } from "@/lib/activity-queries";
import { APP_NAME } from "@/lib/constants";
import { ok, fail, guard, iso, type McpPrincipal } from "./util";

export function registerWorkspaceTools(server: McpServer, p: McpPrincipal) {
  server.registerTool(
    "get_workspace",
    {
      title: "Get workspace",
      description:
        `Who you are acting as in ${APP_NAME}: the user, their team and plan limits, ` +
        "the pipeline stages, and page/deal counts. Call this first to orient " +
        "yourself — stage ids from here are what create_deal/update_deal expect.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    guard(async () => {
      const user = await prisma.user.findUnique({
        where: { id: p.userId },
        select: { id: true, name: true, lastName: true, email: true, company: true },
      });
      if (!user) return fail("User not found");

      const [team, plan, stages, pageCount, openDeals] = await Promise.all([
        p.teamId
          ? prisma.team.findUnique({
              where: { id: p.teamId },
              select: {
                id: true,
                name: true,
                members: {
                  select: {
                    role: true,
                    user: { select: { id: true, name: true, lastName: true, email: true } },
                  },
                  orderBy: { createdAt: "asc" },
                },
              },
            })
          : null,
        p.teamId ? getTeamPlan(p.teamId) : ("FREE" as const),
        ensurePipelineStages(p.userId, p.teamId),
        prisma.page.count({ where: accessiblePageWhere(p.userId, p.teamId) }),
        prisma.deal.count({
          where: { ...accessibleDealWhere(p.userId, p.teamId), status: "OPEN" },
        }),
      ]);

      return ok({
        user: {
          id: user.id,
          name: [user.name, user.lastName].filter(Boolean).join(" "),
          email: user.email,
          company: user.company || null,
        },
        team: team
          ? {
              id: team.id,
              name: team.name,
              plan,
              limits: PLAN_LIMITS[plan],
              members: team.members.map((m) => ({
                id: m.user.id,
                name: [m.user.name, m.user.lastName].filter(Boolean).join(" "),
                email: m.user.email,
                role: m.role,
              })),
            }
          : null,
        pipelineStages: stages.map((s) => ({ id: s.id, name: s.name, order: s.order })),
        counts: { pages: pageCount, openDeals },
        appUrl: p.appUrl,
      });
    })
  );

  server.registerTool(
    "get_recent_activity",
    {
      title: "Recent buyer activity",
      description:
        "Buyer engagement across every page you can see, newest first (last 30 " +
        "days): first/return visits, CTA clicks, downloads, form submissions and " +
        "completed action-plan steps. Good for 'what happened today' questions.",
      inputSchema: {
        limit: z.number().int().min(1).max(ACTIVITY_MAX_LIMIT).optional()
          .describe("Max items (default 20)"),
      },
      annotations: { readOnlyHint: true },
    },
    guard(async ({ limit }) => {
      const items = await listWorkspaceActivity(p.userId, p.teamId, limit ?? 20);
      return ok({ items });
    })
  );

  server.registerTool(
    "list_templates",
    {
      title: "List page templates",
      description:
        "Page templates available to you (global defaults plus your team's saved " +
        "ones). Pass a template id to create_page to start from one.",
      inputSchema: {
        category: z.string().optional().describe("Filter by category slug"),
      },
      annotations: { readOnlyHint: true },
    },
    guard(async ({ category }) => {
      const scope = p.teamId
        ? { OR: [{ isDefault: true }, { teamId: p.teamId }] }
        : { isDefault: true };
      const templates = await prisma.template.findMany({
        where: category ? { AND: [{ category }, scope] } : scope,
        orderBy: { usageCount: "desc" },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          isDefault: true,
          usageCount: true,
          tabs: true,
          createdAt: true,
        },
      });
      return ok({
        templates: templates.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          category: t.category,
          source: t.isDefault ? "global" : "team",
          usageCount: t.usageCount,
          tabNames: safeTabNames(t.tabs),
          createdAt: iso(t.createdAt),
        })),
      });
    })
  );
}

function safeTabNames(raw: string): string[] {
  try {
    const tabs = JSON.parse(raw) as Array<{ label?: string }>;
    return Array.isArray(tabs) ? tabs.map((t) => t.label ?? "").filter(Boolean) : [];
  } catch {
    return [];
  }
}
