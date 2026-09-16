import { describe, it, expect, vi, beforeEach } from "vitest";

// Drive the real McpServer over an in-memory transport with Prisma mocked, so
// the test pins (1) the tool surface clients see, (2) that tools reuse the
// page ACL, and (3) the markdown → tab-content write path.
const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    page: { findUnique: vi.fn(), update: vi.fn() },
    teamMember: { findUnique: vi.fn() },
    tab: { findMany: vi.fn(), update: vi.fn() },
    template: { findMany: vi.fn() },
    $transaction: vi.fn(async (ops: unknown[]) => ops),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
// team-auth/deal-auth import the NextAuth handler for their session variants;
// the MCP path never calls it, but the module must be importable under vitest.
vi.mock("@/auth", () => ({ auth: vi.fn() }));

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createDealbeamMcpServer } from "@/lib/mcp/server";

const USER = "user-1";
const OTHER = "user-2";
const TEAM = "team-1";

async function connect() {
  const server = createDealbeamMcpServer({
    userId: USER,
    teamId: TEAM,
    appUrl: "https://app.example.com",
  });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "0.0.0" });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return { client, server };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Dealbeam MCP server", () => {
  it("exposes the expected tool surface with read-only annotations on reads", async () => {
    const { client } = await connect();
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual(
      [
        "add_deal_comment",
        "add_stakeholder",
        "add_tab",
        "create_deal",
        "create_page",
        "fetch",
        "get_deal",
        "get_page",
        "get_page_analytics",
        "get_recent_activity",
        "get_workspace",
        "link_page_to_deal",
        "list_companies",
        "list_contacts",
        "list_deals",
        "list_pages",
        "list_templates",
        "search",
        "set_tab_content",
        "share_page",
        "update_deal",
        "update_page",
        "upsert_action_plan",
      ].sort()
    );
    for (const tool of tools) {
      expect(tool.description, tool.name).toBeTruthy();
      const isRead = /^(get|list)_/.test(tool.name) || tool.name === "search" || tool.name === "fetch";
      expect(!!tool.annotations?.readOnlyHint, tool.name).toBe(isRead);
    }
  });

  it("returns structured results from a read tool", async () => {
    prismaMock.template.findMany.mockResolvedValue([
      {
        id: "t1",
        name: "Proposal",
        description: "d",
        category: "proposal",
        isDefault: true,
        usageCount: 3,
        tabs: JSON.stringify([{ label: "Overview" }, { label: "Pricing" }]),
        createdAt: new Date("2026-01-01"),
      },
    ]);
    const { client } = await connect();
    const result = await client.callTool({ name: "list_templates", arguments: {} });
    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toEqual({
      templates: [
        expect.objectContaining({
          id: "t1",
          name: "Proposal",
          source: "global",
          tabNames: ["Overview", "Pricing"],
        }),
      ],
    });
    // Team-scoped: only global templates or the caller's team's.
    expect(prismaMock.template.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ isDefault: true }, { teamId: TEAM }] },
      })
    );
  });

  it("enforces the page ACL — another user's PRIVATE page is denied", async () => {
    prismaMock.page.findUnique.mockResolvedValue({
      id: "p1",
      userId: OTHER,
      teamId: TEAM,
      visibility: "PRIVATE",
    });
    const { client } = await connect();
    const result = await client.callTool({ name: "get_page", arguments: { pageId: "p1" } });
    expect(result.isError).toBe(true);
    expect(result.content).toEqual([{ type: "text", text: "This is a private page" }]);
  });

  it("refuses to edit a page locked by a teammate", async () => {
    prismaMock.page.findUnique.mockResolvedValue({
      id: "p1",
      userId: OTHER,
      teamId: TEAM,
      visibility: "TEAM",
      lockedById: OTHER,
      slug: "s",
    });
    prismaMock.teamMember.findUnique.mockResolvedValue({ role: "MEMBER" });
    const { client } = await connect();
    const result = await client.callTool({
      name: "set_tab_content",
      arguments: { pageId: "p1", markdown: "# Hi" },
    });
    expect(result.isError).toBe(true);
    expect(result.content).toEqual([{ type: "text", text: "Page is locked by another user" }]);
    expect(prismaMock.tab.update).not.toHaveBeenCalled();
  });

  it("writes markdown to a tab as sanitized Tiptap JSON (first tab mirrors to the page)", async () => {
    prismaMock.page.findUnique.mockResolvedValue({
      id: "p1",
      userId: USER,
      teamId: TEAM,
      visibility: "TEAM",
      lockedById: null,
      slug: "acme-proposal",
    });
    prismaMock.teamMember.findUnique.mockResolvedValue({ role: "MEMBER" });
    prismaMock.tab.findMany.mockResolvedValue([
      { id: "tab-0", name: "Overview", order: 0, content: "{}" },
      { id: "tab-1", name: "Pricing", order: 1, content: "{}" },
    ]);
    const { client } = await connect();
    const result = await client.callTool({
      name: "set_tab_content",
      arguments: { pageId: "p1", tabName: "pricing", markdown: "## Plans\n\n- Pro **$29**" },
    });
    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toEqual({
      tab: { id: "tab-1", name: "Pricing" },
      blocks: 2,
      text: "Plans\nPro \n$29",
    });
    expect(prismaMock.tab.update).toHaveBeenCalledTimes(1);
    const [{ where, data }] = prismaMock.tab.update.mock.calls[0];
    expect(where).toEqual({ id: "tab-1" });
    expect(JSON.parse(data.content)).toEqual({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Plans" }] },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    { type: "text", text: "Pro " },
                    { type: "text", text: "$29", marks: [{ type: "bold" }] },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
    // Not the first tab → the legacy page.content column is left alone.
    expect(prismaMock.page.update).not.toHaveBeenCalled();
  });

  it("rejects invalid arguments before touching the database", async () => {
    const { client } = await connect();
    const result = await client.callTool({
      name: "share_page",
      arguments: { pageId: "p1", contacts: [{ email: "not-an-email" }] },
    });
    expect(result.isError).toBe(true);
    expect(prismaMock.page.findUnique).not.toHaveBeenCalled();
  });
});
