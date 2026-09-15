/**
 * `search` + `fetch` — the two-tool contract ChatGPT's connectors expect
 * (deep research / chat "Sources"): search returns lightweight hits, fetch
 * returns one full document. Both wrap the same ACL-scoped queries the rest
 * of the server uses, so ChatGPT and Claude see identical data. Results are
 * JSON in a text block (that shape is what ChatGPT parses) plus
 * structuredContent for everyone else.
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { prisma } from "@/lib/prisma";
import { accessiblePageWhere, checkPageAccessFor } from "@/lib/team-auth";
import { accessibleDealWhere, checkDealAccessFor } from "@/lib/deal-auth";
import { getDealDetail } from "@/lib/deal-queries";
import { collectDocText } from "@/lib/page-placeholders";
import { parseDocJson } from "@/lib/pub-html";
import { fail, guard, dealUrl, editorUrl, publicPageUrl, type McpPrincipal } from "./util";

interface SearchHit {
  id: string;
  title: string;
  url: string;
}

interface FetchedDoc {
  id: string;
  title: string;
  text: string;
  url: string;
  metadata: Record<string, unknown>;
}

function jsonResult(data: Record<string, unknown>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data) }],
    structuredContent: data,
  };
}

const MAX_TEXT = 40_000;

export function registerSearchTools(server: McpServer, p: McpPrincipal) {
  server.registerTool(
    "search",
    {
      title: "Search workspace",
      description:
        "Search your pages and deals by title, deal name or company. Returns ids " +
        "to pass to fetch. (This pair is what ChatGPT connectors use; Claude " +
        "clients can use it too or the richer list_/get_ tools.)",
      inputSchema: { query: z.string().min(1).max(200) },
      annotations: { readOnlyHint: true },
    },
    guard(async ({ query }) => {
      const q = query.trim();
      const [pages, deals] = await Promise.all([
        prisma.page.findMany({
          where: {
            AND: [accessiblePageWhere(p.userId, p.teamId), { title: { contains: q, mode: "insensitive" } }],
          },
          select: { id: true, title: true, slug: true, published: true },
          orderBy: { updatedAt: "desc" },
          take: 15,
        }),
        prisma.deal.findMany({
          where: {
            AND: [
              accessibleDealWhere(p.userId, p.teamId),
              {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { company: { name: { contains: q, mode: "insensitive" } } },
                ],
              },
            ],
          },
          select: { id: true, name: true, company: { select: { name: true } } },
          orderBy: { updatedAt: "desc" },
          take: 15,
        }),
      ]);

      const results: SearchHit[] = [
        ...pages.map((pg) => ({
          id: `page:${pg.id}`,
          title: `${pg.title}${pg.published ? "" : " (draft)"}`,
          url: pg.published ? publicPageUrl(p.appUrl, pg.slug) : editorUrl(p.appUrl, pg.id),
        })),
        ...deals.map((d) => ({
          id: `deal:${d.id}`,
          title: d.company ? `${d.name} — ${d.company.name}` : d.name,
          url: dealUrl(p.appUrl, d.id),
        })),
      ];
      return jsonResult({ results });
    })
  );

  server.registerTool(
    "fetch",
    {
      title: "Fetch document",
      description:
        "Fetch the full content of a search result by id ('page:<id>' or " +
        "'deal:<id>'): a page's tabs as text, or a deal's summary with " +
        "stakeholders, linked pages and engagement.",
      inputSchema: { id: z.string().min(1) },
      annotations: { readOnlyHint: true },
    },
    guard(async ({ id }) => {
      const [kind, rawId] = id.includes(":") ? id.split(":", 2) : ["page", id];

      if (kind === "page") {
        const access = await checkPageAccessFor(p.userId, rawId, "view");
        if (!access.authorized) return fail(access.reason ?? "Forbidden");
        const page = await prisma.page.findUnique({
          where: { id: rawId },
          include: {
            tabs: { orderBy: { order: "asc" } },
            deal: { select: { id: true, name: true } },
            _count: { select: { views: true, buyerVisitors: true } },
          },
        });
        if (!page) return fail("Page not found");
        const text = page.tabs
          .map((t) => `## ${t.name}\n\n${collectDocText(parseDocJson(t.content))}`)
          .join("\n\n")
          .slice(0, MAX_TEXT);
        const doc: FetchedDoc = {
          id: `page:${page.id}`,
          title: page.title,
          text,
          url: page.published ? publicPageUrl(p.appUrl, page.slug) : editorUrl(p.appUrl, page.id),
          metadata: {
            type: "page",
            published: page.published,
            visibility: page.visibility,
            deal: page.deal,
            tabs: page.tabs.map((t) => t.name),
            views: page._count.views,
            visitors: page._count.buyerVisitors,
            updatedAt: page.updatedAt.toISOString(),
          },
        };
        return jsonResult(doc as unknown as Record<string, unknown>);
      }

      if (kind === "deal") {
        const access = await checkDealAccessFor(p.userId, rawId, "view");
        if (!access.authorized) return fail(access.reason ?? "Forbidden");
        const deal = await getDealDetail(rawId, p.userId, p.teamId);
        if (!deal) return fail("Deal not found");
        const lines = [
          `# ${deal.name}`,
          deal.company ? `Company: ${deal.company.name}` : null,
          `Stage: ${deal.stage.name} · Status: ${deal.status}`,
          deal.value !== null ? `Value: $${deal.value.toLocaleString("en-US")}` : null,
          deal.expectedCloseDate ? `Expected close: ${deal.expectedCloseDate.slice(0, 10)}` : null,
          `Owner: ${[deal.owner.name, deal.owner.lastName].filter(Boolean).join(" ")}`,
          `Engagement: ${deal.engagement.intent ?? "no activity"}${
            deal.engagement.lastActivityAt ? ` (last ${deal.engagement.lastActivityAt})` : ""
          }`,
          "",
          "## Linked pages",
          ...(deal.rooms.length ? deal.rooms.map((r) => `- ${r.title}${r.published ? "" : " (draft)"}`) : ["(none)"]),
          "",
          "## Stakeholders",
          ...(deal.stakeholders.length
            ? deal.stakeholders.map((s) => `- ${s.name || s.email}${s.title ? `, ${s.title}` : ""} <${s.email}>`)
            : ["(none)"]),
          "",
          "## Comments",
          ...(deal.comments.length
            ? deal.comments.map((c) => `- ${c.createdAt.slice(0, 10)} ${c.author.name}: ${c.body}`)
            : ["(none)"]),
        ].filter((l): l is string => l !== null);
        const doc: FetchedDoc = {
          id: `deal:${deal.id}`,
          title: deal.name,
          text: lines.join("\n").slice(0, MAX_TEXT),
          url: dealUrl(p.appUrl, deal.id),
          metadata: {
            type: "deal",
            status: deal.status,
            stage: deal.stage.name,
            value: deal.value,
            intent: deal.engagement.intent,
            pageIds: deal.rooms.map((r) => `page:${r.id}`),
          },
        };
        return jsonResult(doc as unknown as Record<string, unknown>);
      }

      return fail("Unknown id. Use an id returned by search ('page:…' or 'deal:…').");
    })
  );
}
