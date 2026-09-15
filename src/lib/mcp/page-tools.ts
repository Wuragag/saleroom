/**
 * Page (deal room) tools: list/read pages, read analytics, create pages and
 * tabs, write tab content from markdown, update publish/share settings, share
 * with tracked contacts, and manage the mutual action plan.
 *
 * Every tool goes through checkPageAccessFor — the same ACL the REST routes
 * use — so an API key can never see or touch more than its user could in the
 * app.
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { prisma } from "@/lib/prisma";
import { accessiblePageWhere, checkPageAccessFor } from "@/lib/team-auth";
import { checkDealAccessFor } from "@/lib/deal-auth";
import { createPageWithTabs, templatePageTitle, SlugCollisionError } from "@/lib/page-create";
import { sharePageWithContacts, MAX_SHARE_CONTACTS } from "@/lib/page-share";
import { assertCanCreateTabsTx, withResourceLock } from "@/lib/plan-limits";
import { markdownToDoc } from "@/lib/markdown-to-doc";
import { sanitizeDoc } from "@/lib/ai-page-generation";
import { collectDocText, findPagePlaceholders } from "@/lib/page-placeholders";
import { parseDocJson } from "@/lib/pub-html";
import { getIntentLabel } from "@/lib/engagement-score";
import { DEFAULT_CONTENT, DEFAULT_TAB_NAME } from "@/lib/constants";
import {
  ok,
  fail,
  guard,
  denied,
  iso,
  parseTags,
  publicPageUrl,
  editorUrl,
  bustPublishedPage,
  type McpPrincipal,
} from "./util";

const MARKDOWN_MAX = 60_000;

/** Markdown → sanitized Tiptap doc, or null when nothing survives. */
function docFromMarkdown(markdown: string): Record<string, unknown> | null {
  const doc = sanitizeDoc(markdownToDoc(markdown));
  return doc ? (doc as Record<string, unknown>) : null;
}

function pageSummary(
  p: McpPrincipal,
  page: {
    id: string;
    title: string;
    slug: string;
    published: boolean;
    visibility: string;
    requireEmail: boolean;
    password: string | null;
    dealId: string | null;
    tags: string;
    userId: string;
    lockedById: string | null;
    createdAt: Date;
    updatedAt: Date;
  }
) {
  return {
    id: page.id,
    title: page.title,
    slug: page.slug,
    url: publicPageUrl(p.appUrl, page.slug),
    editorUrl: editorUrl(p.appUrl, page.id),
    published: page.published,
    visibility: page.visibility,
    requireEmail: page.requireEmail,
    hasPassword: !!page.password,
    dealId: page.dealId,
    tags: parseTags(page.tags),
    createdByMe: page.userId === p.userId,
    lockedByOther: !!page.lockedById && page.lockedById !== p.userId,
    createdAt: iso(page.createdAt),
    updatedAt: iso(page.updatedAt),
  };
}

export function registerPageTools(server: McpServer, p: McpPrincipal) {
  // ── Reads ──────────────────────────────────────────────────────────────

  server.registerTool(
    "list_pages",
    {
      title: "List pages",
      description:
        "Deal pages (rooms) you can see: team pages plus your private ones, newest " +
        "first. Filter by title text, publish state or linked deal.",
      inputSchema: {
        query: z.string().optional().describe("Case-insensitive title match"),
        published: z.boolean().optional(),
        dealId: z.string().optional().describe("Only pages linked to this deal"),
        limit: z.number().int().min(1).max(100).optional().describe("Default 25"),
      },
      annotations: { readOnlyHint: true },
    },
    guard(async ({ query, published, dealId, limit }) => {
      const pages = await prisma.page.findMany({
        where: {
          AND: [
            accessiblePageWhere(p.userId, p.teamId),
            query ? { title: { contains: query, mode: "insensitive" } } : {},
            published === undefined ? {} : { published },
            dealId ? { dealId } : {},
          ],
        },
        orderBy: { updatedAt: "desc" },
        take: limit ?? 25,
        include: {
          tabs: { select: { id: true, name: true }, orderBy: { order: "asc" } },
          deal: { select: { id: true, name: true } },
          _count: { select: { views: true, buyerVisitors: true, contacts: true } },
        },
      });
      return ok({
        pages: pages.map((page) => ({
          ...pageSummary(p, page),
          deal: page.deal,
          tabs: page.tabs,
          stats: {
            views: page._count.views,
            visitors: page._count.buyerVisitors,
            sharedWith: page._count.contacts,
          },
        })),
      });
    })
  );

  server.registerTool(
    "get_page",
    {
      title: "Get page",
      description:
        "One page in full: settings, tabs with their content (plain text by " +
        "default, or the Tiptap JSON), the mutual action plan, contacts it was " +
        "shared with, and unresolved placeholders like [Company Name].",
      inputSchema: {
        pageId: z.string(),
        format: z.enum(["text", "json", "none"]).optional()
          .describe("Tab content as plain text (default), raw Tiptap JSON, or omitted"),
      },
      annotations: { readOnlyHint: true },
    },
    guard(async ({ pageId, format }) => {
      const access = await checkPageAccessFor(p.userId, pageId, "view");
      if (!access.authorized) return denied(access.reason);

      const page = await prisma.page.findUnique({
        where: { id: pageId },
        include: {
          tabs: { orderBy: { order: "asc" } },
          deal: { select: { id: true, name: true } },
          mutualActionPlan: { include: { items: { orderBy: { order: "asc" } } } },
          contacts: {
            select: { id: true, email: true, name: true, company: true, refToken: true },
            orderBy: { createdAt: "desc" },
          },
        },
      });
      if (!page) return fail("Page not found");

      const docs = page.tabs.map((t) => parseDocJson(t.content));
      const placeholders = findPagePlaceholders({
        title: page.title,
        eyebrow: page.eyebrow,
        subtitle: page.subtitle,
        tabs: page.tabs.map((t, i) => ({ name: t.name, content: docs[i] })),
      });

      return ok({
        ...pageSummary(p, page),
        eyebrow: page.eyebrow,
        subtitle: page.subtitle,
        deal: page.deal,
        tabs: page.tabs.map((t, i) => ({
          id: t.id,
          name: t.name,
          order: t.order,
          ...(format === "json"
            ? { doc: docs[i] }
            : format === "none"
              ? {}
              : { text: collectDocText(docs[i]) }),
        })),
        actionPlan: page.mutualActionPlan
          ? {
              title: page.mutualActionPlan.title,
              closeDate: iso(page.mutualActionPlan.closeDate),
              items: page.mutualActionPlan.items.map((it) => ({
                id: it.id,
                title: it.title,
                owner: it.ownerType,
                ownerName: it.ownerName,
                dueDate: iso(it.dueDate),
                completed: it.completed,
              })),
            }
          : null,
        sharedWith: page.contacts.map((c) => ({
          id: c.id,
          email: c.email,
          name: c.name,
          company: c.company,
          trackingLink: `${publicPageUrl(p.appUrl, page.slug)}?ref=${c.refToken}`,
        })),
        unresolvedPlaceholders: {
          count: placeholders.count,
          samples: placeholders.samples,
        },
      });
    })
  );

  server.registerTool(
    "get_page_analytics",
    {
      title: "Get page analytics",
      description:
        "Engagement for one page: view/attention totals, share and click counts, " +
        "and the most engaged buyers (identified when they came through a " +
        "tracked link or email gate) with intent labels.",
      inputSchema: {
        pageId: z.string(),
        limit: z.number().int().min(1).max(100).optional().describe("Visitors to return (default 20)"),
      },
      annotations: { readOnlyHint: true },
    },
    guard(async ({ pageId, limit }) => {
      const access = await checkPageAccessFor(p.userId, pageId, "view");
      if (!access.authorized) return denied(access.reason);

      const [viewStats, eventStats, visitorCount, returning, visitors] = await Promise.all([
        prisma.pageView.aggregate({
          where: { pageId },
          _count: { id: true },
          _avg: { duration: true },
          _max: { createdAt: true },
        }),
        prisma.pageEvent.groupBy({ by: ["type"], where: { pageId }, _count: { id: true } }),
        prisma.buyerVisitor.count({ where: { pageId } }),
        prisma.buyerVisitor.count({ where: { pageId, totalSessions: { gt: 1 } } }),
        prisma.buyerVisitor.findMany({
          where: { pageId },
          orderBy: [{ engagementScore: "desc" }, { lastSeenAt: "desc" }],
          take: limit ?? 20,
          include: {
            contact: { select: { name: true, email: true, company: true } },
            sessions: {
              select: { duration: true, tabViews: { select: { tabName: true, duration: true } } },
            },
          },
        }),
      ]);

      const count = (type: string) => eventStats.find((e) => e.type === type)?._count.id ?? 0;

      return ok({
        pageId,
        summary: {
          views: viewStats._count.id,
          avgAttentionSeconds: Math.round(viewStats._avg.duration ?? 0),
          lastViewedAt: iso(viewStats._max.createdAt),
          linkClicks: count("link_click"),
          shares: count("share"),
          visitors: visitorCount,
          returningVisitors: returning,
        },
        visitors: visitors.map((v) => {
          const tabTime = new Map<string, number>();
          let total = 0;
          for (const s of v.sessions) {
            total += s.duration;
            for (const tv of s.tabViews) {
              tabTime.set(tv.tabName, (tabTime.get(tv.tabName) ?? 0) + tv.duration);
            }
          }
          const topTab = [...tabTime.entries()].sort((a, b) => b[1] - a[1])[0];
          return {
            visitorId: v.id,
            name: v.contact?.name ?? null,
            email: v.contact?.email ?? null,
            company: v.contact?.company ?? null,
            anonymousId: v.contact ? null : v.visitorHash.slice(0, 8),
            sessions: v.totalSessions,
            totalAttentionSeconds: total,
            engagementScore: v.engagementScore,
            intent: getIntentLabel(v.engagementScore, v.ctaClicked, false),
            ctaClicked: v.ctaClicked,
            mostViewedTab: topTab?.[0] ?? null,
            firstSeenAt: iso(v.firstSeenAt),
            lastSeenAt: iso(v.lastSeenAt),
          };
        }),
      });
    })
  );

  // ── Writes ─────────────────────────────────────────────────────────────

  server.registerTool(
    "create_page",
    {
      title: "Create page",
      description:
        "Create a new deal page for the current user's team. Start from a template " +
        "(templateId), or give tabs with markdown content, or just a title (one " +
        "empty Overview tab). Pages start unpublished; pass publish: true or use " +
        "update_page later. Optionally link it to a deal.",
      inputSchema: {
        title: z.string().min(1).max(200),
        templateId: z.string().optional().describe("From list_templates"),
        tabs: z
          .array(
            z.object({
              name: z.string().min(1).max(60),
              markdown: z.string().max(MARKDOWN_MAX).optional(),
            })
          )
          .min(1)
          .max(12)
          .optional()
          .describe("Ignored when templateId is given"),
        dealId: z.string().optional().describe("Link the page to this deal"),
        publish: z.boolean().optional(),
      },
    },
    guard(async ({ title, templateId, tabs, dealId, publish }) => {
      if (dealId) {
        const deal = await checkDealAccessFor(p.userId, dealId, "edit");
        if (!deal.authorized) return denied(deal.reason);
      }

      let newTabs: { name: string; content: Record<string, unknown> }[];
      let slugSeed = title;
      let pageTitle = title;

      if (templateId) {
        const template = await prisma.template.findUnique({ where: { id: templateId } });
        // Only global templates or the caller's team's templates (never another tenant's).
        if (!template || (!template.isDefault && (!p.teamId || template.teamId !== p.teamId))) {
          return fail("Template not found");
        }
        const parsed = JSON.parse(template.tabs) as Array<{
          label: string;
          content: Record<string, unknown>;
        }>;
        newTabs = parsed.map((t) => ({ name: t.label, content: t.content }));
        slugSeed = template.name;
        pageTitle = title || templatePageTitle(template.name);
        await prisma.template.update({
          where: { id: templateId },
          data: { usageCount: { increment: 1 } },
        });
      } else if (tabs && tabs.length) {
        newTabs = tabs.map((t) => ({
          name: t.name,
          content: (t.markdown ? docFromMarkdown(t.markdown) : null) ?? DEFAULT_CONTENT,
        }));
      } else {
        newTabs = [{ name: DEFAULT_TAB_NAME, content: DEFAULT_CONTENT }];
      }

      let page;
      try {
        page = await createPageWithTabs({
          userId: p.userId,
          title: pageTitle,
          slugSeed,
          tabs: newTabs,
          dealId: dealId ?? null,
        });
      } catch (err) {
        if (err instanceof SlugCollisionError) return fail(err.message);
        throw err;
      }

      if (publish) {
        page = await prisma.page.update({
          where: { id: page.id },
          data: { published: true },
          include: { tabs: { orderBy: { order: "asc" } } },
        });
      }

      return ok(
        {
          ...pageSummary(p, page),
          tabs: page.tabs.map((t) => ({ id: t.id, name: t.name, order: t.order })),
        },
        `Created "${page.title}".`
      );
    })
  );

  server.registerTool(
    "add_tab",
    {
      title: "Add tab",
      description: "Append a tab (section) to a page, optionally with markdown content.",
      inputSchema: {
        pageId: z.string(),
        name: z.string().min(1).max(60),
        markdown: z.string().max(MARKDOWN_MAX).optional(),
      },
    },
    guard(async ({ pageId, name, markdown }) => {
      const access = await checkPageAccessFor(p.userId, pageId, "edit");
      if (!access.authorized) return denied(access.reason);

      const content = (markdown ? docFromMarkdown(markdown) : null) ?? DEFAULT_CONTENT;
      // Same lock + cap as POST /api/pages/[id]/tabs.
      const tab = await withResourceLock(`page:${pageId}:tabs`, async (tx) => {
        await assertCanCreateTabsTx(tx, pageId, access.page?.teamId ?? null, 1);
        const last = await tx.tab.findFirst({
          where: { pageId },
          orderBy: { order: "desc" },
        });
        return tx.tab.create({
          data: {
            name,
            order: (last?.order ?? -1) + 1,
            content: JSON.stringify(content),
            pageId,
          },
        });
      });
      await bustPublishedPage(access.page?.slug);
      return ok({ tab: { id: tab.id, name: tab.name, order: tab.order } });
    })
  );

  server.registerTool(
    "set_tab_content",
    {
      title: "Set tab content",
      description:
        "Write a tab's content from markdown (headings #/##/###, lists, quotes, " +
        "code fences, tables, ---, **bold**, *italic*, `code`, [links](https://…)). " +
        "Identify the tab by id or by name. mode 'replace' (default) overwrites; " +
        "'append' adds after the existing content.",
      inputSchema: {
        pageId: z.string(),
        tabId: z.string().optional(),
        tabName: z.string().optional().describe("Used when tabId is omitted (case-insensitive)"),
        markdown: z.string().min(1).max(MARKDOWN_MAX),
        mode: z.enum(["replace", "append"]).optional(),
      },
    },
    guard(async ({ pageId, tabId, tabName, markdown, mode }) => {
      const access = await checkPageAccessFor(p.userId, pageId, "edit");
      if (!access.authorized) return denied(access.reason);

      const tabs = await prisma.tab.findMany({ where: { pageId }, orderBy: { order: "asc" } });
      const tab = tabId
        ? tabs.find((t) => t.id === tabId)
        : tabName
          ? tabs.find((t) => t.name.toLowerCase() === tabName.toLowerCase())
          : tabs[0];
      if (!tab) return fail("Tab not found on this page. Use get_page to list its tabs.");

      const incoming = docFromMarkdown(markdown);
      if (!incoming) return fail("The markdown produced no content.");

      let next: Record<string, unknown> = incoming;
      if (mode === "append") {
        const existing = parseDocJson(tab.content);
        const merged = {
          type: "doc",
          content: [
            ...((existing.content as unknown[]) ?? []),
            ...((incoming.content as unknown[]) ?? []),
          ],
        };
        const clean = sanitizeDoc(merged);
        if (!clean) return fail("Combined content is too large.");
        next = clean as Record<string, unknown>;
      }

      const serialized = JSON.stringify(next);
      await prisma.$transaction([
        prisma.tab.update({ where: { id: tab.id }, data: { content: serialized } }),
        // The first tab doubles as the legacy page-level content column.
        ...(tab.order === 0
          ? [prisma.page.update({ where: { id: pageId }, data: { content: serialized } })]
          : []),
      ]);
      await bustPublishedPage(access.page?.slug);

      return ok({
        tab: { id: tab.id, name: tab.name },
        blocks: (next.content as unknown[]).length,
        text: collectDocText(next),
      });
    })
  );

  server.registerTool(
    "update_page",
    {
      title: "Update page settings",
      description:
        "Change a page's title, hero eyebrow/subtitle, publish state, email gate, " +
        "tags, or visibility (PRIVATE = only you; TEAM = whole team; only the " +
        "creator may change it). The slug/URL stays the same.",
      inputSchema: {
        pageId: z.string(),
        title: z.string().min(1).max(200).optional(),
        eyebrow: z.string().max(80).optional(),
        subtitle: z.string().max(220).optional(),
        published: z.boolean().optional(),
        requireEmail: z.boolean().optional().describe("Ask buyers for their email before viewing"),
        tags: z.array(z.string().max(40)).max(20).optional(),
        visibility: z.enum(["TEAM", "PRIVATE"]).optional(),
      },
    },
    guard(async ({ pageId, visibility, ...fields }) => {
      const access = await checkPageAccessFor(p.userId, pageId, "edit");
      if (!access.authorized) return denied(access.reason);
      if (visibility !== undefined && access.page?.userId !== p.userId) {
        return fail("Only the page creator can change visibility");
      }

      const data: Record<string, unknown> = {};
      if (fields.title !== undefined) data.title = fields.title;
      if (fields.eyebrow !== undefined) data.eyebrow = fields.eyebrow;
      if (fields.subtitle !== undefined) data.subtitle = fields.subtitle;
      if (fields.published !== undefined) data.published = fields.published;
      if (fields.requireEmail !== undefined) data.requireEmail = fields.requireEmail;
      if (fields.tags !== undefined) data.tags = JSON.stringify(fields.tags);
      if (visibility !== undefined) data.visibility = visibility;
      if (Object.keys(data).length === 0) return fail("Nothing to update.");

      const page = await prisma.page.update({ where: { id: pageId }, data });
      await bustPublishedPage(page.slug);
      return ok(pageSummary(p, page));
    })
  );

  server.registerTool(
    "share_page",
    {
      title: "Share page with contacts",
      description:
        "Create per-recipient tracking links for a published page so views are " +
        "attributed to named buyers, and optionally email them the link. Returns " +
        "each recipient's unique link — send that one, not the plain page URL.",
      inputSchema: {
        pageId: z.string(),
        contacts: z
          .array(
            z.object({
              email: z.string().email(),
              name: z.string().max(120).optional(),
              company: z.string().max(120).optional(),
            })
          )
          .min(1)
          .max(MAX_SHARE_CONTACTS),
        sendEmail: z.boolean().optional().describe("Email each recipient (default false)"),
      },
    },
    guard(async ({ pageId, contacts, sendEmail }) => {
      const access = await checkPageAccessFor(p.userId, pageId, "edit");
      if (!access.authorized) return denied(access.reason);
      const page = access.page as {
        id: string; title: string; slug: string; teamId: string | null; userId: string; published: boolean;
      };
      if (!page.published) {
        return fail("Publish the page first (update_page with published: true) — tracking links only work on published pages.");
      }
      const sender = await prisma.user.findUnique({
        where: { id: p.userId },
        select: { name: true },
      });
      const created = await sharePageWithContacts({
        page,
        contacts,
        sendEmail: !!sendEmail,
        senderName: sender?.name ?? "Someone",
        appUrl: p.appUrl,
      });
      return ok({ contacts: created, emailed: !!sendEmail });
    })
  );

  server.registerTool(
    "upsert_action_plan",
    {
      title: "Add to mutual action plan",
      description:
        "Create the page's mutual action plan if it doesn't exist (title, target " +
        "close date) and append steps. Each step has an owner side: 'seller' (your " +
        "team) or 'buyer'. Existing steps are left untouched.",
      inputSchema: {
        pageId: z.string(),
        title: z.string().max(120).optional(),
        closeDate: z.string().optional().describe("ISO date (YYYY-MM-DD)"),
        items: z
          .array(
            z.object({
              title: z.string().min(1).max(200),
              owner: z.enum(["seller", "buyer"]).optional(),
              ownerName: z.string().max(120).optional(),
              dueDate: z.string().optional().describe("ISO date"),
            })
          )
          .max(50)
          .optional(),
      },
    },
    guard(async ({ pageId, title, closeDate, items }) => {
      const access = await checkPageAccessFor(p.userId, pageId, "edit");
      if (!access.authorized) return denied(access.reason);

      const close = closeDate ? new Date(closeDate) : null;
      if (close && isNaN(close.getTime())) return fail("Invalid closeDate");
      for (const it of items ?? []) {
        if (it.dueDate && isNaN(new Date(it.dueDate).getTime())) {
          return fail(`Invalid dueDate on "${it.title}"`);
        }
      }

      const map = await prisma.mutualActionPlan.upsert({
        where: { pageId },
        create: { pageId, title: title ?? "Mutual Action Plan", closeDate: close },
        update: {
          ...(title !== undefined ? { title } : {}),
          ...(closeDate !== undefined ? { closeDate: close } : {}),
        },
      });

      if (items?.length) {
        const max = await prisma.mapItem.aggregate({
          where: { mapId: map.id },
          _max: { order: true },
        });
        let order = (max._max.order ?? -1) + 1;
        await prisma.mapItem.createMany({
          data: items.map((it) => ({
            mapId: map.id,
            title: it.title,
            ownerType: it.owner ?? "seller",
            ownerName: it.ownerName ?? "",
            dueDate: it.dueDate ? new Date(it.dueDate) : null,
            completed: false,
            order: order++,
          })),
        });
      }
      await bustPublishedPage(access.page?.slug);

      const full = await prisma.mutualActionPlan.findUniqueOrThrow({
        where: { id: map.id },
        include: { items: { orderBy: { order: "asc" } } },
      });
      return ok({
        actionPlan: {
          title: full.title,
          closeDate: iso(full.closeDate),
          items: full.items.map((it) => ({
            id: it.id,
            title: it.title,
            owner: it.ownerType,
            ownerName: it.ownerName,
            dueDate: iso(it.dueDate),
            completed: it.completed,
          })),
        },
      });
    })
  );
}
