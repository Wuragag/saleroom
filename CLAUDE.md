# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Dealbeam (package codename `dealbeam`, repo `saleroom`) — a multi-tenant
sales-enablement platform. Reps build branded, trackable deal pages (proposals,
mutual action plans, onboarding hubs), share them as a single link, and see
exactly how buyers engage. Public brand name: **Dealbeam** (defined once in
`src/lib/constants.ts` as `APP_NAME` — import it rather than hardcoding).

**Stack:** Next.js 15 (App Router) · React 18 · TypeScript (strict) · NextAuth v5
(JWT sessions) · Prisma 5 + PostgreSQL (Neon) · Stripe billing · Vercel Blob
storage · Upstash rate limiting · Tiptap editor · Anthropic (Claude) for AI ·
Resend for email · Tailwind + shadcn-style primitives.

`docs/FEATURES.md` is the authoritative, source-linked description of every
feature and what is / isn't built — read it before implementing product changes.

## Commands

```bash
npm run dev            # dev server (localhost:3000)
npm run build          # prisma migrate deploy && prisma generate && next build
npm run lint           # ESLint (next/core-web-vitals + next/typescript)
npm run lint:design    # design-token linter (see Design System below) — run before any UI PR
npm test               # vitest run (unit tests, src/**/*.test.ts)
npm run test:watch     # vitest watch mode
npx vitest run src/lib/__tests__/engagement-score.test.ts   # a single test file
npx tsc --noEmit       # typecheck (see note on Prisma-client errors below)

npx prisma migrate dev --name <name>   # create + apply a migration in dev
npx prisma generate                    # regenerate client → src/generated/prisma
npx prisma studio                      # inspect the DB
npx tsx prisma/seed.ts                 # seed templates + demo data (also: prisma db seed)
```

**Prisma client lives at `src/generated/prisma`, not `@prisma/client`.** Import
from `@/generated/prisma` (types/enums) and use the shared singleton
`import { prisma } from "@/lib/prisma"`. After changing `schema.prisma`, run
`npx prisma generate` — otherwise `tsc`/tests report spurious "cannot find
module '@/generated/prisma'" errors. The path alias `@/*` → `src/*`.

Env vars in use (all secrets, kept out of git): `DATABASE_URL`, `DIRECT_URL`
(Neon; append `?connection_limit=5`), `AUTH_SECRET`/`NEXTAUTH_SECRET`,
`NEXTAUTH_URL`, `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`, `STRIPE_TEAM_PRICE_ID`,
`BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, `UPSTASH_REDIS_REST_URL`,
`UPSTASH_REDIS_REST_TOKEN`. Optional external-analytics forwarding (all unset ⇒
disabled): `ANALYTICS_PROVIDER` (`posthog`|`mixpanel`), `POSTHOG_KEY`,
`POSTHOG_HOST` (default `https://us.i.posthog.com`), `MIXPANEL_TOKEN`.

## Architecture

### Three distinct visual surfaces
The app is not one UI — it is three systems that are styled and reskinned
independently. Know which one you're editing (details in `docs/DESIGN-SYSTEM.md`):

1. **App chrome** (dashboard, editor, analytics, settings, auth, admin, modals) —
   the design-token system. All colors/type/radius come from tokens; feature
   files must not hardcode visual values.
2. **Marketing site** (`src/app/(marketing)/`, `src/components/marketing/`) — its
   own bespoke styles, data-driven from `src/data/marketing/`.
3. **Buyer-facing published page** (`page-renderer.tsx`, `published-form.tsx`,
   `tabbed-page-view.tsx`, `/p`, `/preview`, editor `extensions/*` blocks) —
   themed by the **seller's** brand via `src/lib/page-styles.ts` + the
   `--page-accent` CSS var, not the chrome tokens.

### Route groups (`src/app/`)
- `(app)/` — authenticated app dashboard.
- `(marketing)/` — public statically-rendered marketing pages.
- `editor/[id]`, `preview/[id]` — page building & preview.
- `p/[slug]` — the public, no-account-required buyer view (with password/email gates).
- `admin/` — back-office console (DB-backed `isAdmin` gate).
- `api/` — all REST endpoints (Route Handlers). Deeply nested, resource-scoped.

### API route conventions
Route handlers follow a consistent shape (see `src/app/api/pages/route.ts` as the
canonical example):
- Wrap every handler in `withErrorHandler(...)` from `src/lib/api-error.ts`. It
  maps Prisma errors (P2002→409, P2025→404, …), JSON parse errors, and
  `PlanLimitError`→403 to clean responses. Don't hand-roll try/catch for these.
- Parse bodies with `safeJson<T>(request)` (returns `null` instead of throwing).
- Auth: `const session = await auth()` (from `@/auth`); 401 if no `session.user.id`.
- Client-side calls go through `apiClient` (`src/lib/api-client.ts`), which throws
  a typed `ApiError` carrying `status` and `code`.

### Authorization model (multi-tenant)
- **Page access is centralized in `checkPageAccess(pageId, action)`**
  (`src/lib/team-auth.ts`) — never re-implement page ACL inline. Rules: `PRIVATE`
  pages are creator-only; `TEAM` pages are visible to all members, editable unless
  edit-locked by another user (`lockedById`), deletable only by creator or team
  OWNER.
- Teams have OWNER/MEMBER roles. `requireTeamOwner(teamId?)` and
  `getUserTeamId(userId)` (deterministic: earliest-joined team) are the helpers.
- **Admin**: `isAdmin` is enriched into the JWT but **always re-read from the DB**
  for privileged actions (`src/lib/admin-auth.ts`) — never trusted from the token.
- Impersonation uses HMAC-signed, short-lived, single-use tokens
  (`src/lib/impersonation.ts`).

### Plan limits & atomic enforcement
Three flat plans (FREE/PRO/TEAM) defined in `src/lib/plan-limits.ts` (source of
truth `PLAN_LIMITS`); a team's plan resolves from its ACTIVE/TRIALING
`Subscription`, else FREE. **Resource-creation caps must be enforced atomically**
to avoid check-then-create races: use `withResourceLock(lockKey, tx => ...)`
(Postgres advisory lock) wrapping an `assertCanCreate*Tx(...)` assert + the create,
inside one transaction. The assert throws `PlanLimitError`, which `withErrorHandler`
turns into a 403. Prefer the `*Tx` asserts over the plain `canCreate*` read checks
for anything that then creates a row.

### AI & document import
Both AI Write and Document Import (`src/lib/ai-page-generation.ts`,
`ai-composer.ts`, `document-parser.ts`) use a **two-step async pipeline**: create
the row immediately → generate in the background → client polls status. Jobs are
atomically claimed so a duplicate trigger can't fire a duplicate paid generation.
Costs are metered against a monthly AI-credit pool (`src/lib/ai-credits.ts`).
Uploads (PDF/DOCX/PPTX, ≤10 MB) are guarded against decompression bombs.

### Analytics: two layers
- **Page analytics** (`PageView`, `PageEvent`) — lightweight. Duration counts only
  visible-tab time (`src/lib/visible-time.ts`); server writes are monotonic
  (`GREATEST`) so out-of-order sends never shrink recorded durations. Only
  **published** pages are tracked; bots are skipped (`src/lib/bot-detect.ts`).
- **Buyer intelligence** (`BuyerVisitor`/`BuyerSession`/`BuyerTabView`/`BuyerEvent`,
  `SessionRecording`) — identity-aware engagement, per-tab dwell, scroll depth,
  engagement scoring/intent (`engagement-score.ts`, `section-engagement.ts`), and
  opt-in rrweb session replay stored in Postgres. Access follows page visibility.
- **External forwarding** (`src/lib/analytics-forwarder.ts`) — optional, provider-
  agnostic mirror of selected events (product-usage, buyer, raw views) to PostHog
  or Mixpanel. Server-side only (no client SDK / no CSP change), fired via
  Next's `after()` off the response path, and a silent no-op unless the
  `ANALYTICS_PROVIDER` env is set. Postgres stays the source of truth. The pure
  request builders are unit-tested; add new mirrored events there, not inline.

### Shared library (`src/lib/`)
Pure, testable business logic lives here (engagement scoring, visible-time,
section-engagement, bot-detect all have tests in `src/lib/__tests__/`). Keep
business rules in `lib/` as pure functions where possible rather than inline in
routes/components.

## Design system (app chrome)

Detailed in `docs/DESIGN-SYSTEM.md` + `docs/REDESIGN-PLAYBOOK.md`. Key rules,
enforced by `npm run lint:design` (`scripts/check-design-tokens.mjs`) and an
ESLint `no-restricted-syntax` rule:

- **No hardcoded hex or arbitrary Tailwind colors/font-sizes in chrome code.** Use
  design tokens (`bg-primary`, `text-success`, `bg-warning-subtle`, `text-2xs`, …).
  Tokens are HSL triples in `src/app/globals.css` (`:root`/`.dark`), surfaced in
  `tailwind.config.ts`. Status mapping: green→`success`, amber→`warning`,
  red→`destructive`, blue→`info`, gray→`muted`.
- **Compose primitives from `src/components/ui/` before writing markup** — `Button`,
  `IconButton` (requires `aria-label`), `Badge`, `Tag`, `Avatar`, `Card`,
  `PageContainer`, `PageHeader`, `EmptyState`, `SectionLabel`, plus shadcn
  primitives (`Dialog`, `DropdownMenu`, etc.).
- To reskin, edit **tokens + primitives only**, not feature files. If you're
  editing many screens for a visual change, you're doing it wrong.
- Exemptions are **path-based**, not concept-based: the `ALLOW` (source-of-truth /
  brand-data / prompt files) and `EXCLUDE` (marketing site + buyer-facing
  published-page files) arrays at the top of `scripts/check-design-tokens.mjs` are
  the source of truth. If you add a new buyer-facing / published-page file that
  legitimately needs raw hex (e.g. another `pub-*`/`page-*` renderer), add its path
  there — don't assume "it's buyer-facing" makes it auto-exempt. Everything else is
  chrome and must use a token.

## Security & platform notes

- HTTP hardening (CSP, HSTS, X-Frame-Options, referrer policy) is set in
  `next.config.mjs`. Embeds are limited to an allowlist of providers (YouTube,
  Vimeo, Loom, Google Docs, Airtable, Calendly) — extend the `frame-src` CSP and
  the embed allowlist together when adding one.
- Page HTML is sanitized with DOMPurify before render (`page-renderer.tsx`).
- Rate limiting (`src/lib/rate-limit.ts`) uses Upstash in prod with an in-memory
  dev fallback; applied to auth, uploads, AI/import, forms, and analytics writes.
- Stripe webhooks are signature-verified (`src/app/api/webhooks/stripe/route.ts`).
- Vercel Blob storage is **public-read only** — never put private data there
  (session replays deliberately go to Postgres for this reason).

## Testing

Vitest, unit-focused, under `src/lib/__tests__/` (`*.test.ts`). The suite covers
the pure business-logic functions in `lib/`. New pure utilities/scoring/parsing
logic should get a test in `src/lib/__tests__/` (vitest picks up any
`src/**/*.test.ts`).
