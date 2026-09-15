# Dealbeam MCP Server

Dealbeam ships a [Model Context Protocol](https://modelcontextprotocol.io) server
so AI assistants (Claude Code, Claude Desktop, Cursor, any MCP client) can work
inside a rep's workspace: read buyer engagement, draft and publish deal pages,
share tracked links, and keep the pipeline up to date — always as that rep,
with that rep's permissions.

- **Endpoint:** `https://<your-app>/api/mcp` (Streamable HTTP, stateless, JSON responses)
- **Auth:** personal API key as `Authorization: Bearer dbk_…`
- **Where keys live:** Settings → Integrations (`/settings?tab=integrations`)
- **Code:** [`src/app/api/mcp/route.ts`](../src/app/api/mcp/route.ts) (transport),
  [`src/lib/mcp/`](../src/lib/mcp/) (server + tools),
  [`src/lib/api-keys.ts`](../src/lib/api-keys.ts) (keys)

## Connecting a client

Create a key under Settings → Integrations (it is shown once), then:

**Claude Code**

```bash
claude mcp add --transport http dealbeam https://<your-app>/api/mcp \
  --header "Authorization: Bearer dbk_..."
```

**Cursor / Windsurf / any JSON `mcpServers` config**

```json
{
  "mcpServers": {
    "dealbeam": {
      "url": "https://<your-app>/api/mcp",
      "headers": { "Authorization": "Bearer dbk_..." }
    }
  }
}
```

**Claude Desktop** (expects stdio, so bridge with `mcp-remote`)

```json
{
  "mcpServers": {
    "dealbeam": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://<your-app>/api/mcp",
               "--header", "Authorization: Bearer dbk_..."]
    }
  }
}
```

Local dev: the same against `http://localhost:3000/api/mcp`.

## Tools

Reads are annotated `readOnlyHint` so clients can auto-approve them. Every
result is returned both as readable JSON text and as `structuredContent`.

| Tool | What it does |
|------|--------------|
| `get_workspace` | Who you are, team + plan limits, members, pipeline stages, counts. Call first. |
| `get_recent_activity` | Buyer activity across all visible pages (30 days): visits, CTA clicks, downloads, form submits, completed MAP steps. |
| `list_templates` | Global + team page templates. |
| `list_pages` | Pages you can see, filtered by title / published / deal. |
| `get_page` | One page: settings, tabs as text (or Tiptap JSON), action plan, tracked contacts, unresolved placeholders. |
| `get_page_analytics` | View/attention totals, shares, clicks, top visitors with intent labels. |
| `create_page` | New page from a template, from markdown tabs, or empty; optional deal link and publish. |
| `add_tab` | Append a tab, optionally with markdown. |
| `set_tab_content` | Replace or append a tab's content from markdown. |
| `update_page` | Title, hero eyebrow/subtitle, published, email gate, tags, visibility (creator only). |
| `share_page` | Per-recipient tracking links for a published page, optional email. |
| `upsert_action_plan` | Create the mutual action plan if missing and append steps. |
| `list_deals` | Pipeline with engagement rollups; same filters as the board toolbar. |
| `get_deal` | Full deal detail (rooms, stakeholders, action plans, comments). |
| `create_deal` | New deal (owner = you); stage by id or name; optional page link. |
| `update_deal` | Rename, company, value, close date, stage move, WON/LOST/OPEN. |
| `add_deal_comment` | Team-only note. |
| `add_stakeholder` | Buyer-side person on a deal. |
| `link_page_to_deal` | Attach an existing page to a deal. |
| `list_contacts` / `list_companies` | The canonical buyer book with warmth. |

### Markdown → page content

`create_page`, `add_tab` and `set_tab_content` take markdown and convert it with
[`src/lib/markdown-to-doc.ts`](../src/lib/markdown-to-doc.ts): headings
(`#`–`###`), paragraphs, bullet/ordered lists (one nesting level), blockquotes,
fenced code, `---`, pipe tables, and `**bold**` / `*italic*` / `` `code` `` /
`[links](https://…)` (http(s)/mailto only). The result is then run through the
same `sanitizeDoc` the AI composer uses, so MCP-written content can never
contain a node the editor doesn't know.

## Security model

- **Keys act as their user.** Every tool resolves the key to a user, then goes
  through the same centralized ACLs as the REST API — `checkPageAccessFor` /
  `checkDealAccessFor` (the session-free variants of `checkPageAccess` /
  `checkDealAccess`) and the `accessible*Where` list scopes. PRIVATE pages stay
  creator-only, edit locks are honored, team boundaries hold.
- **Plan limits apply.** Page, tab and open-deal caps are enforced with the
  same atomic `assertCan*Tx` asserts under the advisory lock; a cap shows up as
  a readable tool error ("Plan limit: …").
- **Keys are hashed.** Only a SHA-256 hash and a 12-char display prefix are
  stored (`ApiKey` model); the plaintext is shown once. Up to 10 keys per user;
  revoking is immediate.
- **Rate limited** per key (120 requests/min) via the shared Upstash limiter.
- **Not exposed:** password protection, ownership reassignment, deleting
  pages/deals, billing, team management, AI generation (which spends credits).
  Those stay in the app.

## Implementation notes

- Stateless transport: `/api/mcp` builds a fresh `McpServer` per request with
  the principal bound in (`createDealbeamMcpServer({ userId, teamId, appUrl })`),
  so no session store is needed and it runs on serverless. `enableJsonResponse`
  keeps responses plain JSON (no long-lived SSE).
- Tools live in `src/lib/mcp/{workspace,page,deal}-tools.ts` and reuse the
  app's query layer (`deal-queries`, `contact-queries`, `activity-queries`,
  `page-create`, `page-share`), so numbers and behavior match the UI.
- Tested over the SDK's in-memory transport with Prisma mocked
  (`src/lib/__tests__/mcp-server.test.ts`).
- Adding a tool: register it in the relevant `register*Tools` with a zod
  `inputSchema`, wrap the handler in `guard()`, gate it with the ACL helper,
  and add its name to the surface test.
