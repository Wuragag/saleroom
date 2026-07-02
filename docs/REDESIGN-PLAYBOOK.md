# Redesign Playbook

How to reskin the **product UI** fast, cheaply, and without regressions. The
codebase was refactored so that a visual redesign touches **tokens + primitives
only** — not feature files. If you find yourself editing dozens of screens, stop:
you're doing it wrong, edit the token or the primitive instead.

Read [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) first for the token/primitive catalog.

---

## The 10-minute reskin (colors, radius, type, fonts)

Edit **two files**. Nothing else.

1. **`src/app/globals.css`** — the `:root` (and `.dark`) token block.
   - Brand: `--primary`, `--primary-foreground`, `--ring`.
   - Surfaces/text: `--background`, `--card`, `--muted`, `--secondary`, `--accent`, `--foreground`, `--muted-foreground`, `--border`, `--input`.
   - Status: `--success*`, `--warning*`, `--info*`, `--destructive*` (solid + `-subtle` pairs).
   - Data-viz: `--chart-1..5`. Categorical: `--cat-1..6`.
   - Corner style: `--radius` (drives sm→2xl everywhere).
2. **`tailwind.config.ts`** — only if you're changing the *scales* themselves:
   - `fontFamily.sans` (swap the product typeface).
   - `fontSize` (the `2xs`/`3xs` steps).
   - `borderRadius` (the `--radius` multipliers).

Because every screen consumes these via tokens, changing them reskins the whole
app. Verify with `npm run lint:design` (must pass) then eyeball a few routes.

> Changing the font: the family is loaded in `src/app/layout.tsx` and exposed as
> `--font-montserrat` → `fontFamily.sans`. Swap the `next/font` import and the CSS
> var, and every `font-sans` surface follows.

---

## The component reskin (changing how a control *looks*)

To restyle a control everywhere it appears, edit its **primitive**, not its call
sites. Each primitive is one file in `src/components/ui/`:

| Change how… looks | Edit |
|---|---|
| all buttons | `button.tsx` (`buttonVariants` cva) |
| icon buttons | `icon-button.tsx` |
| status pills / badges | `badge.tsx` (`badgeVariants`) |
| tags | `tag.tsx` |
| avatars | `avatar.tsx` |
| cards / boxed sections | `card.tsx` |
| page shells / widths | `page-container.tsx` |
| page titles | `page-header.tsx` |
| empty states | `empty-state.tsx` |
| section labels | `section-label.tsx` |
| dialogs, dropdowns, inputs, tooltips, … | the matching `ui/*.tsx` |

Motion lives in `src/app/globals.css` (the keyframes block + the
`prefers-reduced-motion` overrides).

---

## A structural redesign (new layout / navigation)

Only when changing *arrangement*, not just skin, do you touch feature files — and
even then, a small set:

- **App frame / nav:** `src/components/app-nav.tsx`.
- **Per-route shells:** each route wraps its body in `<PageContainer>` + `<PageHeader>`; change those primitives to move the title block or change widths globally, or edit an individual `src/app/**/page.tsx` for a one-off.
- **Editor frame:** `src/components/editor/tiptap-editor.tsx` (shell), `tab-sidebar.tsx` (left panel / mobile drawer), `editor-header.tsx`, `editor-toolbar.tsx`.

---

## Guardrails (keep the reskin from rotting)

- `npm run lint:design` — fails on hardcoded hex, arbitrary Tailwind colors, and
  arbitrary font sizes in chrome code. Run it in CI and before every UI PR.
  Allowed exceptions are listed at the top of
  [scripts/check-design-tokens.mjs](../scripts/check-design-tokens.mjs)
  (globals.css, tailwind.config, `page-styles.ts`, `email.ts`, `color-palettes.ts`,
  `ui/` primitives; the marketing site and buyer-facing published page are out of scope).
- `npm run lint` — ESLint (also flags hardcoded hex in JSX via `no-restricted-syntax`).

## Explicitly out of scope for a product reskin

- **Marketing site** — `src/app/(marketing)/`, `src/components/marketing/`: its own bespoke visual system.
- **Buyer-facing published page** — `page-renderer.tsx`, `published-form.tsx`, `tabbed-page-view.tsx`, `/p`, `/preview`, and the editor `extensions/*` blocks: themed by the **seller's** brand (`src/lib/page-styles.ts` + the `--page-accent` variable), reskinned there.
- **Email** — `src/lib/email.ts`: inline hex required by mail clients.
- **Content-color pickers** — `src/lib/color-palettes.ts`: the swatches a seller picks page colors from.

---

## Checklist for a reskin PR

- [ ] Only `globals.css` + `tailwind.config.ts` (+ optionally `ui/*` primitives) changed for a pure visual reskin.
- [ ] `npm run lint:design` passes.
- [ ] `npm run lint` passes.
- [ ] `npx tsc --noEmit` shows no new errors (Prisma-client "cannot find module" errors are environmental — run `prisma generate` for a clean check).
- [ ] Spot-checked dashboard, editor, analytics, settings, auth in the browser (incl. a narrow viewport).
