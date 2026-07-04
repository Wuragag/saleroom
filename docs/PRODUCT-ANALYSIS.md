# SalesRoom — Product Analysis, Improvement Areas & Gaps

> Point-in-time analysis (July 2026) of the SalesRoom product as implemented in
> this codebase. Sources: `docs/FEATURES.md`, `prisma/schema.prisma`, the
> marketing data files, and a code-level review of billing, analytics, the
> published-page experience, and the growth/lifecycle surface. Each finding
> cites the code it was verified against.

---

## 1. Executive summary

SalesRoom's **core loop is genuinely strong**: build a branded deal page fast
(templates, AI Write, document import, a polished Tiptap block editor), share
one link, and get unusually deep buyer intelligence back (per-tab dwell,
per-section scroll depth, engagement/intent scoring, session replay). The
engineering quality of what exists is high — atomic plan-limit enforcement,
sanitized rendering, monotonic analytics writes, bcrypt-hashed page passwords,
zero TODO/FIXME debt markers in application code.

The gaps cluster into four themes, in priority order:

1. **Trust gap** — the marketing site sells several features that do not exist
   (CRM sync, SSO, Slack alerts, a 14-day trial, AI that "learns from your best
   pages"), and in-app prices disagree with marketing prices. This is direct
   revenue/credibility exposure and the cheapest thing to fix.
2. **Deal-room gap** — buyers can only *watch and read*. There is no
   buyer↔seller communication, no file sharing/downloads, no e-signature or
   proposal acceptance. These are table-stakes in the digital-sales-room
   category (Dock, Trumpet, GetAccept, Aligned all have them) and are the
   biggest product-side misses.
3. **Revenue-mechanics gap** — no trial despite advertising one, `PAST_DUE`
   instantly strips paid features with no dunning, no annual plans, no AI-credit
   top-ups, and the admin console measures vanity counts instead of
   MRR/conversion/churn.
4. **Growth-loop gap** — the "Powered by SalesRoom" badge on every public page
   is a dead, non-clickable span; onboarding is a single role question with no
   seeded demo page; only 4 transactional emails exist and there is no
   scheduler, so no digests, win-backs, or usage warnings are possible.

---

## 2. What's built and working well

Worth stating explicitly, because the roadmap should protect these strengths:

- **Page builder** — Notion-style editor with 10+ custom blocks, auto-save with
  flush-on-unload, per-page theming, tabs, duplicate, edit-locking
  (`src/components/editor/`, `src/hooks/use-auto-save.ts`).
- **Buyer intelligence** — visitor identity via per-recipient `ref` links and
  email gates, visible-tab-only attention time, per-section scroll depth,
  engagement/intent scoring, opt-in rrweb session replay stored privately in
  Postgres (`src/lib/engagement-score.ts`, `section-engagement.ts`,
  `session-recorder.tsx`).
- **AI surface** — AI Write, document import (PDF/DOCX/PPTX), and a multi-turn
  AI composer/chat workspace (`src/app/api/ai-chat/[pageId]/route.ts`,
  `src/components/ai/ai-workspace.tsx`) — the composer isn't even documented in
  `docs/FEATURES.md` yet, let alone marketed.
- **Platform hygiene** — centralized ACL (`checkPageAccess`), advisory-lock
  plan enforcement, rate limiting everywhere it matters, signature-verified
  Stripe webhooks, CSP/embed allowlists, decompression-bomb guards.
- **Mutual Action Plans** — a real shared close plan with owner sides, due
  dates, buyer-togglable items, and live progress.

---

## 3. Gap analysis

### 3.1 Marketing vs. reality (trust & legal exposure) — fix first

The marketing site sells capabilities `docs/FEATURES.md` itself lists as "Not
Yet Built":

| Claim | Where claimed | Reality |
|---|---|---|
| Salesforce/HubSpot CRM sync | `src/data/marketing/features.ts:88-94`, Team tier `pricing.ts:58` | No integration code exists |
| SSO & SCIM provisioning | `features.ts:94`, Team tier `pricing.ts:59` | Email/password only (`src/auth.ts`) |
| Slack alerts | `features.ts:88,93` | Email view-notification only |
| Zapier & webhooks | `features.ts:93` | No outbound webhook system |
| "AI learns from your best-performing pages" | `features.ts:54,58`, `AISection.tsx:17-21,113-115` | AI is single-pass; no performance feedback loop. The most-repeated unbacked claim on the site |
| Multi-language / translation | `features.ts:56,59` | Not implemented |
| "Internal share detection" | `features.ts:37,42`, `SolutionSection.tsx`, `ProblemSection.tsx` | Only seller-side `share` events exist; buyer forwarding is not detected |
| 14-day Pro free trial | `pricing.ts:43,71` | Checkout sets no `trial_period_days` (`src/app/api/billing/checkout/route.ts:68-78`); no code path ever creates a TRIALING subscription |
| "Trusted by 2,400+ AEs", named testimonials (Gong/Salesforce/HubSpot employees) | `HeroSection.tsx`, `SocialProofSection.tsx` | Hard-coded, unsubstantiated |

**Pricing inconsistencies (three sources disagree):**

- Marketing: Pro **$29**, Team **$79** (`pricing.ts`).
- In-app billing settings: Pro **$19**, Team **$49** (`billing-settings.tsx:56-79`).
- Actual charge: whatever the Stripe env price IDs point at.
- Marketing gates AI to Pro, but FREE actually includes 20 AI credits/month
  (`plan-limits.ts:28`); no tier discloses the 20/300/1000 credit caps at all.
- "Advanced/Team analytics" tiering (`pricing.ts:20,34,57`) has **no code
  backing** — all plans get identical analytics, including session replay.
- "Role-based permissions" (Team tier) overstates a two-role OWNER/MEMBER model.

**Recommendations**
1. Strip or clearly badge ("coming soon") every unbuilt claim on the marketing
   site; remove fabricated social proof. One data-file PR (`src/data/marketing/`).
2. Make one module the price/feature source of truth (extend
   `src/lib/plan-limits.ts` with display prices + feature lists; render both
   marketing pricing and `billing-settings.tsx` from it).
3. Either implement the 14-day trial (`subscription_data.trial_period_days: 14`
   in checkout — the TRIALING plumbing already works) or remove the claim.
4. Under-sold shipped features to promote instead: **session replay**,
   **document import**, **engagement/intent scoring**, **Mutual Action Plans**,
   the **AI composer** — all real differentiators currently invisible in
   marketing (and the composer is missing from `docs/FEATURES.md` too).

### 3.2 The buyer experience (core product gaps)

Buyers today can read, switch tabs, click CTAs, submit one form type, and tick
their own MAP items. In a "digital sales room" category, that's read-only-plus.

| Gap | Evidence | Why it matters |
|---|---|---|
| **No buyer↔seller communication** — no comments, questions, chat | No Comment/Thread model in `schema.prisma`; grep confirms nothing buyer-facing | Forms are the only inbound channel. Deal conversations happen off-platform, so SalesRoom loses the engagement data it sells |
| **No file sharing / downloads** | No file/attachment block in `src/components/editor/extensions/`; uploads exist only for covers/logos/avatars | Sharing a deck or contract — the most basic deal-room act — requires linking out to Drive/Dropbox |
| **No e-signature / proposal acceptance** | No signature/approval model anywhere | The deal can't *close* in the room; competitors (GetAccept, especially) anchor on this |
| **MAP has no buyer identity** | `MapItem.ownerName` is a free-text string (`schema.prisma:408`) | Buyers can't be assigned + notified; a MAP is only as useful as its accountability loop |
| **MAP silent-revert bug** | `map-viewer.tsx` renders a clickable checkbox on seller-owned items; the API 403s and `fetchMap()` silently reverts (line 57) | A buyer ticks a seller task, watches it un-tick with no explanation — feels broken |
| **No page PDF export / offline artifact** | No export code | Procurement/legal still ask for a document |
| **Mobile polish** | Left-tab layout: fixed `w-44` sidebar, no responsive stacking (`tabbed-page-view.tsx:109-168`); metrics block uses `repeat(N,1fr)` with no wrap (`page-renderer.tsx` ~716) | Buyers open share links on phones; the two worst layouts are buyer-facing |

**Recommendations (in order):**
1. **File/attachment block** with tracked downloads — smallest lift (Blob is
   public-read, so route downloads through an authenticated redirect endpoint
   or accept public files initially), big perceived value, and download events
   enrich the engagement score.
2. **Buyer comments** on the page (email-identified via the existing
   gate/`PageContact` identity; notify the seller via the existing Resend
   path). This turns the page from a brochure into a workspace and directly
   feeds the notification/digest system in §3.4.
3. **MAP v2** — link items to `PageContact`, send due-date/assignment emails,
   notify sellers on buyer completion; fix the silent-revert checkbox (disable
   + tooltip on non-buyer items).
4. **Proposal acceptance** (typed-name acceptance with audit trail first; full
   e-sign or an integration later).
5. Fix the two mobile layouts.

### 3.3 Monetization & billing mechanics

| Gap | Evidence | Impact |
|---|---|---|
| Advertised trial doesn't exist | `checkout/route.ts:68-78` | Conversion loss + a false claim |
| `PAST_DUE` = instant feature loss, no dunning | `getTeamPlan` counts only ACTIVE/TRIALING (`plan-limits.ts:59`); webhook just flips status; no email, no in-app fix-your-card banner | Involuntary churn from transient card failures |
| No annual pricing | Single monthly price ID per plan (`src/lib/stripe.ts:19-22`) | Leaves 12-month commitment revenue + churn reduction on the table |
| AI credits can't be topped up | No purchase endpoint; error copy says only "Upgrade" (`ai-credits.ts:110,141`) | Missed expansion revenue; hard wall for heavy Pro users |
| Downgrade doesn't reconcile over-limit resources | `handleSubscriptionDeleted` (`webhooks/stripe/route.ts:117-129`) only flips the plan | Canceled teams keep 50 published pages forever → weak re-subscription pressure (decide deliberately: grace period then unpublish beyond cap is the common pattern) |
| Upsell prompts all target PRO | `upgrade-prompt.tsx` defaults `targetPlan="PRO"` everywhere | No TEAM upgrade path pressure (seats are the natural trigger) |
| Paywalls are only reactive | Prompts fire on `PLAN_LIMIT` errors only | No "80% of credits used" nudges (the usage meter in billing settings is the only hint) |
| Admin metrics are vanity counts | `admin/metrics/route.ts:15-46`: user/team/page counts + plan distribution (which miscounts CANCELED/PAST_DUE as FREE) | The business can't see MRR, conversion, churn, activation, or AI-credit burn |

**Recommendations:** implement the trial; add a dunning path (email + in-app
banner + a short `PAST_DUE` grace window before feature loss); add annual
prices; sell AI credit packs (Stripe one-time payments — the metering ledger
already exists in `TeamAiCredits`); instrument real metrics (MRR from
subscriptions, FREE→paid conversion, weekly activation).

### 3.4 Growth, activation & lifecycle

- **The viral loop is dead on arrival.** Every public page footer renders
  "Powered by SalesRoom" as a *non-clickable* low-contrast `<span>`
  (`page-shell.tsx:88-105`). Buyers are the top of the funnel in this category
  — make it a link with UTM/referral attribution. Also: Pro advertises "Custom
  branding" (`pricing.ts:37`) but no code hides the badge by plan — either
  ship badge-removal as the Pro perk it implies, or drop the claim.
- **No referral program, no public template gallery.** Templates are strictly
  team-private (`api/templates/route.ts:23-31`); a community gallery is a
  proven SEO/acquisition surface for this category.
- **Activation is an empty room.** Onboarding is one role question
  (`onboarding-flow.tsx`, `totalSteps = 1`) whose answer personalizes nothing;
  signup seeds **no demo page** (`api/auth/signup/route.ts:104-141`), so a new
  FREE user lands on an empty dashboard with a 1-page cap. Seed a pre-built
  example page (with fake analytics, ideally) and add a 3–4 item activation
  checklist (create → publish → share → first view). The role answer should
  pick the default template shown.
- **Email lifecycle: 4 transactional sends, zero lifecycle.** Only password
  reset, share-page, team invite, and view-notification exist
  (`src/lib/email.ts`). No welcome, no weekly engagement digest, no
  credit-usage warning, no win-back, no dunning — and **no scheduler at all**
  (no cron routes, no `vercel.json`), so none of these are currently possible.
  A weekly "who engaged with your pages" digest is the single highest-leverage
  retention email for this product. Also: the sender is still
  `onboarding@resend.dev` (`email.ts:3`) — a sandbox domain that must change
  before production.
- **Notifications are one event, one channel, one recipient.** Only
  "new visitor session" → owner email. No form-submission alert, no MAP
  completion alert, no high-intent alert, no in-app notification center, no
  team routing. The buyer-intelligence engine computes intent labels that
  never proactively reach the seller.

### 3.5 Seller workflow & team collaboration

| Gap | Evidence |
|---|---|
| No page archiving — only permanent delete | No archive/status field on `Page`; dashboard bulk delete is destructive |
| No page expiration / scheduled unpublish | No `expiresAt` on `Page` (`schema.prisma:150-191`) — deal pages with pricing live forever |
| No custom domains / white-label URLs | No domain field on `Team`/`Page`; `/p/[slug]` on the app domain is the only option — a standard Pro/Team-tier feature in this category |
| No CSV/PDF export of analytics or form submissions | No export code anywhere; submissions viewable only in-app |
| No version history | Undo is Tiptap in-session only; one bad auto-save away from silent content loss |
| No team comments/@mentions, no approval flow | Locking is exclusive-editor only; publish is a binary flag |
| No deal metadata | Pages have tags only — no company/value/stage/close-date fields, which limits both dashboard organization and future CRM sync |

Quick wins here: an `archivedAt` field + dashboard filter; `expiresAt` checked
in `/p/[slug]`; CSV export of submissions and visitor analytics (small, often a
procurement checkbox); a simple page-snapshot version history (a
`PageRevision` row per N saves would go far).

### 3.6 Analytics depth

The behavioral layer is excellent, but acquisition context is absent:

- `PageView` stores only `duration` + `createdAt` (`schema.prisma:206-215`) —
  **no referrer, UTM, country, device, or browser** on either analytics layer.
  Sellers can't tell where a buyer came from or whether the link was forwarded
  to another company (which is also what "internal share detection" would need).
- No benchmark/rollup views: no team-level analytics, no
  "this template converts best" — which is exactly the data the marketed
  "AI learns from your best pages" feature would need. Capturing
  content-performance rollups is the prerequisite to honestly shipping that
  claim.
- Anthropic token usage isn't recorded anywhere (`ai-credits.ts` comment) —
  flat credit costs can't be validated against real cost of goods.

### 3.7 Integrations & platform

Nothing exists today: no CRM sync, no Slack, no Zapier, no public API, no
outbound webhooks, no SSO (all confirmed absent; see §3.1). A pragmatic order:

1. **Outbound webhooks** (page viewed / form submitted / MAP completed /
   high-intent visitor) — cheapest to build, instantly enables Zapier/Make and
   honest "integrations" marketing.
2. **Slack notifications** — the single most-requested channel for sales teams;
   reuses the notification events from §3.4.
3. **CRM sync** (HubSpot first — easier API/OAuth, better SMB fit than
   Salesforce) — requires deal metadata on pages (§3.5) to be useful.
4. **SSO** — gate behind the TEAM plan; table-stakes only once moving upmarket.

---

## 4. Prioritized roadmap

**P0 — this week (trust & correctness, near-zero build cost)**
1. Fix marketing/pricing truthfulness: remove or badge unbuilt claims, remove
   fabricated social proof, single price source of truth (§3.1).
2. Production email sender domain; fix the MAP silent-revert checkbox; fix the
   two mobile buyer-page layouts (§3.2).
3. Implement the 14-day trial or delete the claim (§3.3).

**P1 — this quarter (close the category gap, build the retention loop)**
4. File/attachment block with tracked downloads (§3.2).
5. Buyer comments + seller notifications (§3.2, §3.4).
6. Event-based notifications → weekly digest email + scheduler; make the
   "Powered by" badge a tracked link and hide it on paid plans (§3.4).
7. Dunning flow + `PAST_DUE` grace period; annual pricing; AI credit packs (§3.3).
8. Seeded demo page + activation checklist at signup (§3.4).
9. Archiving, page expiration, CSV exports (§3.5).
10. Referrer/UTM/device capture on views (§3.6).

**P2 — next quarter (differentiation & expansion revenue)**
11. Outbound webhooks → Slack integration → Zapier listing (§3.7).
12. MAP v2 with buyer identity and reminders; proposal acceptance/e-sign (§3.2).
13. Version history; team comments/approvals (§3.5).
14. Content-performance rollups → then honestly ship "AI learns from your best
    pages" (§3.6).
15. Custom domains (Pro/Team); HubSpot sync; real business metrics in admin
    (MRR, conversion, churn) (§3.5, §3.3).

---

## 5. Competitive context (category table-stakes check)

Against digital-sales-room incumbents (Dock, Trumpet, GetAccept, Aligned,
Recapped): SalesRoom's **buyer analytics depth (session replay, per-section
scroll, intent scoring) meets or beats the category**, and the AI
page-generation surface is ahead of most. It is **behind on**: file sharing
(all of them), buyer chat/comments (Aligned, Trumpet, Dock), e-signature
(GetAccept's anchor; Dock via integrations), CRM sync (all), custom domains
(most), and MAP task accountability with reminders (Recapped, Dock). The P1/P2
ordering above is sequenced to close exactly those gaps while marketing starts
selling the analytics depth that's already built.
