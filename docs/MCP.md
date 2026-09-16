# Dealbeam MCP Server

Dealbeam ships a [Model Context Protocol](https://modelcontextprotocol.io) server
so AI assistants (Claude Code, Claude Desktop, Cursor, any MCP client) can work
inside a rep's workspace: read buyer engagement, draft and publish deal pages,
share tracked links, and keep the pipeline up to date — always as that rep,
with that rep's permissions.

- **Endpoint:** `https://<your-app>/api/mcp` (Streamable HTTP, stateless, JSON responses)
- **Auth, two ways:** OAuth 2.1 (hosted assistants: claude.ai, ChatGPT) or a
  personal API key as `Authorization: Bearer dbk_…` (developer tools)
- **Where it's managed:** Settings → Integrations (`/settings?tab=integrations`)
- **Code:** [`src/app/api/mcp/route.ts`](../src/app/api/mcp/route.ts) (transport),
  [`src/lib/mcp/`](../src/lib/mcp/) (server + tools),
  [`src/lib/oauth.ts`](../src/lib/oauth.ts) / [`oauth-server.ts`](../src/lib/oauth-server.ts)
  (authorization server), [`src/lib/api-keys.ts`](../src/lib/api-keys.ts) (keys)

## Connecting from Claude (claude.ai) or ChatGPT

No keys involved — the user signs in and approves once:

1. **Claude:** Settings → Connectors → *Add custom connector* → paste
   `https://<your-app>/api/mcp` → *Connect*.
2. **ChatGPT:** Settings → Connectors → *Advanced* → enable *Developer mode* →
   *Create* → paste the URL, authentication *OAuth* → *Connect*.
3. The assistant opens `https://<your-app>/oauth/authorize`; the user signs in
   (if needed) and clicks *Allow access*. Done — the connector shows up under
   *Connected apps* in Settings → Integrations, where it can be disconnected.

Under the hood this is standard MCP authorization: the endpoint answers an
unauthenticated call with `401` + `WWW-Authenticate: Bearer resource_metadata=…`,
the client reads `/.well-known/oauth-protected-resource` and
`/.well-known/oauth-authorization-server`, registers itself at
`/api/oauth/register` (RFC 7591 dynamic registration), runs the
authorization-code flow with PKCE S256 through `/oauth/authorize` and
`/api/oauth/token`, and refreshes with rotating refresh tokens. ChatGPT's
connector mode also expects `search` + `fetch` tools, which the server
provides alongside the richer ones.

## Connecting a developer tool (API key)

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
| `search` / `fetch` | Two-step find-then-read over pages and deals (the contract ChatGPT connectors use). |

### Markdown → page content

`create_page`, `add_tab` and `set_tab_content` take markdown and convert it with
[`src/lib/markdown-to-doc.ts`](../src/lib/markdown-to-doc.ts): headings
(`#`–`###`), paragraphs, bullet/ordered lists (one nesting level), blockquotes,
fenced code, `---`, pipe tables, and `**bold**` / `*italic*` / `` `code` `` /
`[links](https://…)` (http(s)/mailto only). The result is then run through the
same `sanitizeDoc` the AI composer uses, so MCP-written content can never
contain a node the editor doesn't know.

## OAuth server details

| Endpoint | Purpose |
|----------|---------|
| `GET /.well-known/oauth-authorization-server` | RFC 8414 metadata (endpoints, `S256`, DCR, supported grants). |
| `GET /.well-known/oauth-protected-resource` (+ `/api/mcp` suffix) | RFC 9728 resource metadata pointed to by the 401 challenge. |
| `POST /api/oauth/register` | Dynamic client registration. Open (that's how connectors onboard); a client can't do anything until a user approves it; PKCE is mandatory. Redirect URIs must be https, loopback http, or a private scheme, no fragments. |
| `GET /oauth/authorize` | Consent page (signed-in users; middleware preserves the query through sign-in). Unknown client / unregistered redirect never redirects; other errors go back to the client per RFC 6749. |
| `POST /api/oauth/authorize` | The consent decision. Re-validates everything, mints a single-use 10-minute code, returns the redirect URL (navigated by JS so the CSP `form-action` rule isn't tripped). |
| `POST /api/oauth/token` | `authorization_code` (PKCE verified, code consumed atomically, replay revokes the tokens it issued) and `refresh_token` (rotating). Access tokens live 1 h, refresh tokens 30 days. Public clients (`none`) and `client_secret_basic/post` supported. |
| `POST /api/oauth/revoke` | RFC 7009. |
| `GET/DELETE /api/account/connected-apps[/:clientId]` | The user's live grants; disconnect revokes every token for that app. |

Codes, access tokens and refresh tokens are opaque (`dbac_` / `dbat_` / `dbrt_`
+ 40 hex) and stored as SHA-256 hashes only (`OAuthClient`,
`OAuthAuthorizationCode`, `OAuthToken`). Scopes (`read write`) are advertised
but advisory: every token acts with the approving user's full permissions.

## Security model

- **Credentials act as their user.** Every tool resolves the key or token to a user, then goes
  through the same centralized ACLs as the REST API — `checkPageAccessFor` /
  `checkDealAccessFor` (the session-free variants of `checkPageAccess` /
  `checkDealAccess`) and the `accessible*Where` list scopes. PRIVATE pages stay
  creator-only, edit locks are honored, team boundaries hold.
- **Plan limits apply.** Page, tab and open-deal caps are enforced with the
  same atomic `assertCan*Tx` asserts under the advisory lock; a cap shows up as
  a readable tool error ("Plan limit: …").
- **Secrets are hashed.** API keys, codes and tokens are stored as SHA-256
  hashes; plaintext is shown/returned once. Up to 10 keys per user; revoking a
  key or disconnecting an app is immediate.
- **Rate limited** per credential on `/api/mcp` (120/min) and per IP on the
  OAuth endpoints, via the shared Upstash limiter.
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
  (`src/lib/__tests__/mcp-server.test.ts`); the OAuth rules are pure and
  tested in `src/lib/__tests__/oauth.test.ts`.
- Adding a tool: register it in the relevant `register*Tools` with a zod
  `inputSchema`, wrap the handler in `guard()`, gate it with the ACL helper,
  and add its name to the surface test.
