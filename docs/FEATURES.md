# Dealbeam — Feature Documentation

> Codename: **dealbeam** / **saleroom**. User-facing brand: **Dealbeam**.
> A multi-tenant sales-enablement platform where reps build branded, trackable
> deal pages — proposals, mutual action plans, onboarding hubs — share them as a
> single link, and see exactly how buyers engage.

This document describes what is **actually implemented** in the codebase. Where
the marketing site claims capabilities that are not yet built, they are listed
under [Roadmap / Not Yet Built](#roadmap--not-yet-built) rather than mixed in.

**Stack:** Next.js 15 (App Router) · React 18 · NextAuth v5 (JWT sessions) ·
Prisma 5 + PostgreSQL (Neon) · Stripe billing · Vercel Blob storage · Upstash
rate limiting · Tiptap editor · Anthropic (Claude) for AI · Resend for email.

---

## Table of Contents

1. [Plans & Limits](#1-plans--limits)
2. [Accounts & Authentication](#2-accounts--authentication)
3. [Onboarding & Product Tour](#3-onboarding--product-tour)
4. [The Page Builder](#4-the-page-builder)
5. [Content Blocks](#5-content-blocks)
6. [Tabs (Multi-Section Pages)](#6-tabs-multi-section-pages)
7. [Templates](#7-templates)
8. [Synced Blocks](#8-synced-blocks)
9. [AI Writing & Document Import](#9-ai-writing--document-import)
10. [Publishing, Sharing & Access Gates](#10-publishing-sharing--access-gates)
11. [Mutual Action Plans](#11-mutual-action-plans)
12. [Forms & Submissions](#12-forms--submissions)
13. [Analytics & Buyer Intelligence](#13-analytics--buyer-intelligence)
14. [Teams & Collaboration](#14-teams--collaboration)
15. [Billing](#15-billing)
16. [Admin Console](#16-admin-console)
17. [Marketing Site](#17-marketing-site)
18. [Security & Platform](#18-security--platform)
19. [Roadmap / Not Yet Built](#roadmap--not-yet-built)

---

## 1. Plans & Limits

Three flat-rate plans (no per-seat billing). Limits are enforced server-side at
every resource-creation point.

| Capability            | FREE | PRO         | TEAM      |
|-----------------------|------|-------------|-----------|
| Price                 | $0   | $29/mo      | $79/mo    |
| Pages                 | 1    | Unlimited   | Unlimited |
| Tabs per page         | 3    | Unlimited   | Unlimited |
| Team members          | 1    | 3           | Unlimited |
| Synced blocks         | 0    | 20          | Unlimited |
| Password protection   | —    | ✓           | ✓         |
| Team invites          | —    | ✓           | ✓         |
| AI content & import   | ✓    | ✓           | ✓         |
| Analytics             | ✓    | ✓           | ✓         |

Source of truth: [`src/lib/plan-limits.ts`](../src/lib/plan-limits.ts). Plans map
to Stripe prices in [`src/lib/stripe.ts`](../src/lib/stripe.ts). A team's plan is
resolved from its active/trialing `Subscription`; no subscription = FREE.

---

## 2. Accounts & Authentication

Email/password authentication via NextAuth v5 with a JWT session strategy.

- **Sign up** ([`/auth/signup`](../src/app/auth/signup/page.tsx)) — creates a user
  (bcrypt-hashed password) and a personal team. Onboarding starts immediately.
- **Sign in** ([`/auth/signin`](../src/app/auth/signin/page.tsx)) — rate-limited to
  5 failed attempts per email per minute to blunt brute-force.
- **Forgot / reset password** — single-use, time-limited reset tokens emailed via
  Resend (`PasswordResetToken` model).
- **Account settings** ([`/settings`](../src/app/settings/page.tsx)) — update
  name/company/profile, change password (requires current password), and upload
  an avatar (JPEG/PNG/WebP, ≤2 MB, stored in Vercel Blob).
- **Session enrichment** — the JWT carries `teamId`, `teamRole`, `plan`,
  `planLimits`, and `isAdmin`. Admin status is always re-read from the database
  for privileged actions, never trusted from the token alone.

Key files: [`src/auth.ts`](../src/auth.ts),
[`src/lib/team-auth.ts`](../src/lib/team-auth.ts),
[`src/lib/admin-auth.ts`](../src/lib/admin-auth.ts).

---

## 3. Onboarding & Product Tour

- **Onboarding flow** ([`/onboarding`](../src/app/onboarding/page.tsx)) — collects
  the user's role and brand details after signup; gated in server components to
  avoid stale-JWT redirect loops.
- **Product tour** — an interactive, spotlight-style guided tour of the app for
  first-time users (`hasSeenTour` flag), with a welcome dialog, step tooltips, and
  a completion state. See [`src/components/tour/`](../src/components/tour/).

---

## 4. The Page Builder

A Notion-style block editor (Tiptap) that turns a deal into a polished, branded
web page. Editor: [`/editor/[id]`](../src/app/editor/[id]/page.tsx).

- **Block-based editing** with a slash (`/`) command menu to insert any block.
- **Rich text**: headings, lists, blockquotes, tables, code, links, text color,
  images (Tiptap StarterKit + extensions).
- **Auto-save** — debounced background saving with a live save-status indicator;
  pending edits are flushed on tab switch and on unmount (via `keepalive` fetch)
  ([`src/hooks/use-auto-save.ts`](../src/hooks/use-auto-save.ts)).
- **Branding & theming** (per page): font, accent color, layout width, background,
  tab placement, logo, and cover image. See
  [`src/lib/page-styles.ts`](../src/lib/page-styles.ts) and the
  [style panel](../src/components/editor/style-panel.tsx).
- **Cover image & logo** upload (Vercel Blob, rate-limited).
- **Links editor** — a set of page-level links (e.g. resources, social).
- **Tags** for organizing pages on the dashboard.
- **Page visibility**: `TEAM` (any team member can view/edit) or `PRIVATE`
  (creator-only).
- **Edit locking** — a team member can lock a page so only they can edit it,
  preventing concurrent-edit clobbering.
- **Duplicate** — clone a page (and all its tabs); copies start unpublished and
  unprotected.

The dashboard ([`/dashboard`](../src/app/(app)/dashboard/page.tsx)) lists pages
with drag-to-reorder, card/row views, thumbnails, and per-page actions.

---

## 5. Content Blocks

Beyond rich text, the editor ships custom blocks (Tiptap node extensions in
[`src/components/editor/extensions/`](../src/components/editor/extensions/)):

| Block            | Purpose |
|------------------|---------|
| **Embed**        | Video / calendar / doc embeds — YouTube, Vimeo, Loom, Google Docs, Airtable, Calendly (allowlisted providers). |
| **CTA Button**   | A prominent call-to-action button with a link. |
| **Logo Grid**    | A "trusted by" grid of customer/partner logos. |
| **Form**         | An inline lead-capture form (see [Forms](#12-forms--submissions)). |
| **Contact Card** | One or more named contacts with title, email, phone, and photo. |
| **Banner**       | A highlighted callout strip with emoji, style, and optional link. |
| **Synced Block** | A reference to shared, team-managed content (see [Synced Blocks](#8-synced-blocks)). |
| **Testimonial**  | A pull-quote with author and role. |
| **Metrics**      | A row of headline numbers (value + label). |
| **Spacer**       | Vertical spacing control (sm/md/lg/xl). |

All blocks render on the public page through a sanitized renderer
([`src/components/page-renderer.tsx`](../src/components/page-renderer.tsx)); page
HTML is sanitized with DOMPurify before display.

---

## 6. Tabs (Multi-Section Pages)

A page can be split into ordered **tabs** (e.g. *Overview · Solution · Pricing ·
Next Steps*), each with its own Tiptap content.

- Reorder via drag-and-drop; rename inline.
- Tab placement (top / side) is part of page theming.
- Buyers' time and views are tracked **per tab** (see Buyer Intelligence).
- Tab count per page is plan-limited (FREE: 3).

Models: `Tab`. UI: [`tab-sidebar`](../src/components/editor/tab-sidebar.tsx),
[`tabbed-page-view`](../src/components/tabbed-page-view.tsx).

---

## 7. Templates

Start a page from a pre-built layout instead of a blank canvas.

- **8 built-in templates** (seeded), spanning post-call, proposal, deal-room, and
  onboarding categories — e.g. Call Recap, Business Proposal, Mutual Action Plan,
  Competitor Battle Card, Customer Onboarding, QBR, Executive One-Pager, ROI Case
  Study. See [`prisma/seed.ts`](../prisma/seed.ts).
- **Save as template** — turn any of your pages into a reusable template. Saved
  templates are **scoped to your team** (private to it); built-in templates are
  global.
- **Create from template** — instantiate a new multi-tab page from any template
  your team can access. Tracks a `usageCount` per template.

API: [`/api/templates`](../src/app/api/templates/route.ts),
[`/api/pages/from-template`](../src/app/api/pages/from-template/route.ts).
UI: [`template-picker`](../src/components/template-picker.tsx).

---

## 8. Synced Blocks

Reusable content blocks managed once and embedded across many pages — when the
source changes, every page that references it reflects the update.

- Team-scoped library of named blocks (`SyncedBlock`).
- Insert into any page via the synced-block picker; edit centrally.
- Plan-limited (FREE: 0, PRO: 20, TEAM: unlimited).

API: [`/api/synced-blocks`](../src/app/api/synced-blocks/route.ts). UI:
[`synced-block-library`](../src/components/synced-block-library.tsx),
[`synced-block-picker`](../src/components/editor/synced-block-picker.tsx).

---

## 9. AI Writing & Document Import

Two AI-powered ways to create a page, both using Claude (Haiku).

- **AI Write** ([`/ai`](../src/app/ai/[[...pageId]]/page.tsx),
  [`/api/ai-chat/[pageId]`](../src/app/api/ai-chat/[pageId]/route.ts)) —
  describe the sales page you want in chat. The workspace creates a draft page,
  plans the buyer journey, builds tabs one at a time, persists generated tab
  content server-side for reload durability, and applies the result through the
  live editor. Existing pages can be edited with the same chat via `/ai/{pageId}`.
- **Document Import** ([`/api/import`](../src/app/api/import/route.ts)) — upload a
  **PDF, DOCX, or PPTX** (≤10 MB); text is extracted server-side
  ([`src/lib/document-parser.ts`](../src/lib/document-parser.ts)) and Claude
  converts it into a structured page.
- Both paths are **rate-limited per user**, **plan-limited**, and governed by
  monthly AI credits. Uploads are guarded against decompression bombs.

UI: [`ai-workspace`](../src/components/ai/ai-workspace.tsx),
[`ai-chat-panel`](../src/components/ai/ai-chat-panel.tsx),
[`import-document-modal`](../src/components/import-document-modal.tsx).

---

## 10. Publishing, Sharing & Access Gates

- **Public pages** — published pages are served at
  [`/p/[slug]`](../src/app/p/[slug]/page.tsx) with a unique, human-readable slug.
  Buyers need **no account** to view.
- **Share modal** — copy the link, manage publish state, and (Pro+) set a password.
- **Password protection** (Pro+) — gate a page behind a password
  ([`/p/[slug]/password`](../src/app/p/[slug]/password/page.tsx)).
- **Email gate** (`requireEmail`) — require a visitor to enter their email before
  viewing; captured visitors become `PageContact` records.
- **Per-recipient tracking links** — share a page with a specific contact via a
  unique `ref` token so engagement is attributed to a named person
  ([`/api/ref`](../src/app/api/ref/route.ts), `PageContact.refToken`).
- **Preview** ([`/preview/[id]`](../src/app/preview/[id]/page.tsx)) — see the page
  as a buyer would before publishing.

---

## 11. Mutual Action Plans

A shared, trackable close plan embedded in a deal page (`MutualActionPlan` +
`MapItem`).

- Ordered checklist items, each with an **owner side** (seller / buyer), owner
  name, optional **due date**, and completion state.
- An overall plan title and target **close date**.
- Drag-to-reorder; buyers can watch progress in real time.

API: [`/api/pages/[id]/map`](../src/app/api/pages/[id]/map/route.ts) and
`/map/items`. Hook: [`src/hooks/use-map.ts`](../src/hooks/use-map.ts). Viewer:
[`map-viewer`](../src/components/map-viewer.tsx).

---

## 12. Forms & Submissions

- **Form block** — embed a lead-capture form directly in a page.
- **Submissions** are stored per page (`FormSubmission`) and surfaced in a
  dashboard at [`/submissions`](../src/app/submissions/page.tsx).
- A page event is recorded on each submission for the activity timeline.

API: [`/api/forms/submit`](../src/app/api/forms/submit/route.ts),
[`/api/forms/submissions`](../src/app/api/forms/submissions/route.ts). UI:
[`published-form`](../src/components/published-form.tsx),
[`submissions-table`](../src/components/submissions-table.tsx).

---

## 13. Analytics & Buyer Intelligence

Two layers of tracking: lightweight page analytics and rich per-buyer intelligence.

### Page Analytics ([`/analytics`](../src/app/analytics/page.tsx))
- **Page views** with duration (`PageView`) and a **views-over-time chart**.
- **True attention time** — duration counts only visible-tab time via a shared
  tracker ([`src/lib/visible-time.ts`](../src/lib/visible-time.ts)); background
  tabs don't accrue. Server writes are monotonic (`GREATEST`), so late or
  out-of-order sends never shrink recorded durations.
- **Page events** (`PageEvent`) — typed interactions (CTA clicks, downloads,
  shares — a `share` event is recorded when a page is shared with contacts).
- Per-page stat cards and a sortable table.
- A non-blocking client tracker
  ([`analytics-tracker`](../src/components/analytics-tracker.tsx)) records views and
  dwell time; write endpoints are rate-limited, only track **published** pages,
  and skip known bots ([`src/lib/bot-detect.ts`](../src/lib/bot-detect.ts)).
  Clicked-link URLs are stored without query strings/fragments (PII hygiene).

### Buyer Intelligence
Deep, identity-aware engagement on published pages:
- **Visitors** (`BuyerVisitor`) — deduped by a visitor hash, with first/last seen,
  session count, a computed **engagement score**, and a CTA-clicked flag. Linked to
  a named `PageContact` when known.
- **Sessions** (`BuyerSession`) — visible-time duration, return-visit detection,
  per-session engagement score. Sessions resumed within 30 minutes are seeded
  with their accumulated duration/tab state so heartbeats never reset totals.
- **View notifications** — opt-in per page (`Page.notifyOnView`, toggle in the
  share modal): the owner gets an email when a new visitor session starts
  (throttled to 5/hour per page, sent post-response via `after()`).
- **Per-tab views** (`BuyerTabView`) — which tabs a buyer spent time on.
- **Per-section engagement** — expand any visitor row in the buyer panel to see a
  per-tab breakdown: dwell time, share of total time, view count, and deepest
  scroll reached in that section. Scroll depth is tracked per-section (the
  tracker tags `SCROLL_*` events with the active tab and resets milestones on tab
  switch); aggregation is a pure, tested function
  ([`src/lib/section-engagement.ts`](../src/lib/section-engagement.ts)).
- **Events** (`BuyerEvent`) — granular in-session actions.
- **Engagement scoring & intent** — visitor activity rolls up into an engagement
  score and an intent label (e.g. *High Intent / Warm / Cold*) via
  [`src/lib/engagement-score.ts`](../src/lib/engagement-score.ts).
- **Activity timeline** — a reverse-chronological feed of buyer activity for a page
  ([`/api/buyer/timeline/[pageId]`](../src/app/api/buyer/timeline/[pageId]/route.ts)),
  plus a per-buyer analytics panel.
- **Session replay** — opt-in per page (`Page.recordingEnabled`, toggle in the
  share modal): records DOM + mouse/scroll activity via
  [rrweb](https://github.com/rrweb-io/rrweb)
  ([`session-recorder`](../src/components/session-recorder.tsx), lazy-loaded so
  non-recording pages never download it), all text inputs masked. Chunks flush
  every ~20s to `SessionRecording` rows in Postgres (not Blob — keeps the same
  authenticated-read-only privacy model as the rest of buyer analytics; this
  project's Blob store is public-only). Capped at 120 chunks (~40 min) per
  session. Watch a replay from a visitor's session list in the buyer panel
  ([`session-replay-player`](../src/components/session-replay-player.tsx)).

> Access control: analytics and buyer data follow the page's visibility — team
> members see TEAM pages; PRIVATE-page intelligence is creator-only.

UI: [`buyer-analytics-panel`](../src/components/buyer-analytics-panel.tsx),
[`activity-timeline`](../src/components/activity-timeline.tsx),
[`views-chart`](../src/components/views-chart.tsx).

---

## 14. Teams & Collaboration

- **Teams** with two roles: **OWNER** and **MEMBER** (`Team`, `TeamMember`).
- **Email invites** (Pro+) — invite by email with a unique, expiring, single-use
  token; the invitee must be signed in with the **invited email** to accept.
- **Member management** — owners can remove members and manage the roster; seat
  count is plan-limited and enforced atomically on accept.
- **Shared resources** — TEAM-visibility pages, the team template library, and
  synced blocks are shared across the team.

API: [`/api/team`](../src/app/api/team/route.ts), `/api/team/invite`,
`/api/team/members`. Settings UI:
[`team-settings`](../src/components/team-settings.tsx). Invite acceptance:
[`/invite/[token]`](../src/app/invite/[token]/page.tsx).

---

## 15. Billing

Stripe-powered subscriptions, owner-gated.

- **Checkout** ([`/api/billing/checkout`](../src/app/api/billing/checkout/route.ts))
  — team owners start a PRO/TEAM subscription via Stripe Checkout.
- **Billing portal** ([`/api/billing/portal`](../src/app/api/billing/portal/route.ts))
  — owners manage payment method, change plan, or cancel.
- **Webhooks** ([`/api/webhooks/stripe`](../src/app/api/webhooks/stripe/route.ts))
  — signature-verified handling of checkout completion, subscription
  updates/cancellation, and payment success/failure; keeps the local
  `Subscription` (plan, status, period) in sync.
- **Status** ([`/api/billing/status`](../src/app/api/billing/status/route.ts)) and
  in-app [`billing-settings`](../src/components/billing-settings.tsx) /
  [`upgrade-prompt`](../src/components/upgrade-prompt.tsx).

Subscription statuses tracked: `ACTIVE`, `TRIALING`, `PAST_DUE`, `CANCELED`,
`INCOMPLETE`, `UNPAID`.

---

## 16. Admin Console

A back-office at [`/admin`](../src/app/admin/page.tsx), gated by a database-backed
`isAdmin` check on every request.

- **Metrics** — platform-wide usage/health figures.
- **Users** — list, edit, delete, and reset passwords.
- **Teams** — list teams and manually adjust subscriptions.
- **Imports** — monitor document-import jobs and retry failures.
- **Impersonation** — sign in as a target user via a short-lived, signed,
  **single-use** token; an impersonation banner is shown throughout the session.

API under [`/api/admin/`](../src/app/api/admin/). Helpers:
[`admin-auth`](../src/lib/admin-auth.ts),
[`impersonation`](../src/lib/impersonation.ts).

---

## 17. Marketing Site

Public, statically-rendered marketing pages under
[`src/app/(marketing)/`](../src/app/(marketing)/):

- **Landing page** (hero, problem/solution, comparison, social proof, demo, AI).
- **Features** index + per-feature detail pages.
- **Pricing** (with FAQ), **Use Cases**, and **Examples**.

Content is data-driven from [`src/data/marketing/`](../src/data/marketing/).

---

## 18. Security & Platform

- **Multi-tenant authorization** — page access is centralized in
  `checkPageAccess()` (PRIVATE = creator-only; TEAM = members, with edit-locking);
  admin actions re-verify `isAdmin` from the DB.
- **Rate limiting** — Upstash (with an in-memory dev fallback) on auth, uploads,
  AI/import, forms, and analytics write endpoints
  ([`src/lib/rate-limit.ts`](../src/lib/rate-limit.ts)).
- **Atomic plan-limit enforcement** — resource-creation limits are enforced inside
  advisory-locked transactions so concurrent requests can't exceed caps.
- **Input handling** — page HTML sanitized with DOMPurify; uploads are type/size
  validated and guarded against zip decompression bombs.
- **HTTP hardening** — CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, and
  a referrer policy set in [`next.config.mjs`](../next.config.mjs); embeds limited
  to an allowlist of providers.
- **Secrets & billing** — Stripe webhooks are signature-verified; impersonation
  tokens are HMAC-signed, short-lived, and single-use.

Data model: [`prisma/schema.prisma`](../prisma/schema.prisma).

---

## Roadmap / Not Yet Built

The marketing site references the following, which are **not implemented** in the
current codebase. They should be treated as roadmap/aspirational:

- **CRM sync** (Salesforce, HubSpot) — no integration code exists.
- **Slack / external notifications** — buyer-engagement alerts are not wired to
  Slack or email push.
- **Zapier / public webhooks** — no outbound webhook system.
- **SSO & SCIM provisioning** — auth is email/password only today.
- **Calendar integrations beyond embeds** — Calendly/Cal.com are supported only as
  iframe embeds, not as booking integrations.
- **Multi-language AI / brand-voice learning** — AI generation is single-pass and
  not yet personalized to per-team "best performing" content.

---

*Generated from a review of the codebase. For the authoritative behavior of any
feature, the linked source files are the source of truth.*
