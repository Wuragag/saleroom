# Dealbeam Product Design System

> The single source of truth for the **product UI (app chrome)**. Everything a
> reskin touches lives in two places: **tokens** (`globals.css` + `tailwind.config.ts`)
> and **primitives** (`src/components/ui/`). Feature files must not hardcode
> visual values. The marketing site and the buyer-facing published page are
> separate visual systems (see [Scope](#scope)).

Enforced by `npm run lint:design` ([scripts/check-design-tokens.mjs](../scripts/check-design-tokens.mjs)).

---

## Scope

| Surface | In this system? | Reskinned via |
|---|---|---|
| App chrome (dashboard, editor, analytics, settings, auth, onboarding, tour, admin, modals) | ✅ yes | tokens + primitives |
| Marketing site (`src/app/(marketing)`, `src/components/marketing`) | ❌ no | its own bespoke styles |
| Buyer-facing published page (`page-renderer`, `published-form`, `tabbed-page-view`, `/p`, `/preview`, editor `extensions/` blocks) | ❌ no | the seller-brand system (`src/lib/page-styles.ts` + `--page-accent`) |
| Transactional email (`src/lib/email.ts`) | ❌ no | inline hex (mail clients lack CSS vars) |
| Content-color pickers (`src/lib/color-palettes.ts`) | ❌ no | that data file (these are user color *choices*, not chrome) |

---

## 1. Tokens

All colors are HSL triples in `:root` and `.dark` in [globals.css](../src/app/globals.css),
surfaced as Tailwind utilities in [tailwind.config.ts](../tailwind.config.ts).
**Never write a hex value or an ad-hoc `emerald-*/amber-*/red-*/blue-*` utility in chrome code** — use a token.

### Color

| Intent | Utilities |
|---|---|
| Page / surfaces | `bg-background`, `bg-card`, `bg-popover`, `bg-muted`, `bg-secondary`, `bg-accent` |
| Text | `text-foreground`, `text-muted-foreground`, `*-foreground` pairs |
| Lines / focus | `border-border`, `ring-ring`, `bg-input` |
| Brand | `bg-primary` / `text-primary` / `text-primary-foreground` |
| **Success** (positive, "live", done) | solid `bg-success text-success-foreground`; tint `bg-success-subtle text-success-subtle-foreground` |
| **Warning** (pending, caution) | `bg-warning …` / `bg-warning-subtle …` |
| **Info** (neutral-informational) | `bg-info …` / `bg-info-subtle …` |
| **Danger / destructive** (errors, delete) | `bg-destructive …` / `bg-destructive-subtle …` |
| Neutral status | `bg-muted text-muted-foreground` |
| Data-viz | `text-chart-1` … `text-chart-5` (brand-green family) |
| Categorical (tags/avatars) | **only** via `<Tag>` / `<Avatar>` — they consume `--cat-1..6`. Never use `cat-*` directly. |

All the new tokens support alpha (`bg-success/10`, `text-info/70`, …).

**Status-color mapping** (when replacing old utilities):
`emerald/green → success`, `amber/yellow/orange → warning`, `red/rose → destructive`,
`blue/sky → info`, `slate/zinc/gray → muted / Badge neutral`.

### Radius

Everything derives from `--radius` (0.625rem), so a single change reflows the app:
`rounded-sm < rounded-md < rounded-lg < rounded-xl < rounded-2xl`, plus `rounded-full`.

Convention: **controls → `rounded-lg`**, **cards/containers → `rounded-xl`**, **pills/avatars/badges → `rounded-full`**. Don't invent `rounded-[14px]`.

### Typography

Scale only — no `text-[10px]` / `text-[13px]` / `text-[0.9375rem]`:
`text-3xs` (10px) · `text-2xs` (11px) · `text-xs` (12) · `text-sm` (14) · `text-base` (16) · `text-lg/xl/2xl/3xl…`.
(Map a stray `0.9375rem` → `text-sm`.)

Font family: `font-sans` (Montserrat) is the product face; set via `--font-montserrat`.

---

## 2. Primitives (`src/components/ui/`)

Import and compose these instead of re-implementing markup.

| Primitive | Use for | Replaces |
|---|---|---|
| `Button` | any labelled action | ad-hoc `<button className="bg-primary …">` |
| `IconButton` (**requires `aria-label`**, `size sm\|md\|lg`) | icon-only controls | raw icon `<button>` |
| `Badge` (`variant default\|secondary\|outline\|success\|warning\|info\|danger\|neutral\|destructive`) | status pills | `bg-emerald-50 text-emerald-700 …` |
| `Tag` (`label`, `size`) | labelled category chips | `TAG_PALETTE` hex arrays |
| `Avatar` (`name`, `src`, `size`) | user/visitor avatars | `AVATAR_COLORS` + inline `initials()` |
| `Card` (+ `CardHeader/Title/Description/Content/Footer`) | boxed sections | `bg-card border border-border rounded-xl p-6` |
| `PageContainer` (`size sm\|md\|lg\|full`) | route body shell | `max-w-* mx-auto px-6 py-6` |
| `PageHeader` (`title`, `description`, `actions`) | page title block | copy-pasted `h2 + p + button row` |
| `EmptyState` (`icon`, `title`, `description`, `action`) | zero/empty states | bespoke centered empties |
| `SectionLabel` | tiny uppercase labels | `text-[10px] uppercase tracking-widest …` |

Existing shadcn primitives (`Dialog`, `DropdownMenu`, `AlertDialog`, `Tooltip`, `Popover`, `Input`, `Separator`, `Skeleton`, `Progress`, `Calendar`, `DatePicker`) are unchanged.

---

## 3. Rules

1. No hardcoded `#hex` in chrome. The only allowed hex is a CSS-var fallback: `var(--page-accent, #003B22)`.
2. No arbitrary Tailwind **color** (`bg-[#…]`) or **font-size** (`text-[13px]`) in chrome — use tokens.
3. Every icon-only button is an `IconButton` (or `Button size="icon"`) **with an `aria-label`**.
4. Reach for a primitive before writing markup; reach for a token before writing a value.
5. Dynamic, data-driven color (a seller's chosen `--page-accent`, a chart bar height) stays as an inline style — that's not a hardcoded design decision.

Run `npm run lint:design` before committing UI. See [REDESIGN-PLAYBOOK.md](./REDESIGN-PLAYBOOK.md) to actually perform a reskin.
