#!/usr/bin/env node
/**
 * Design-system guardrail.
 *
 * Fails if feature code contains visual decisions that should live in tokens or
 * primitives instead — the things that make a reskin expensive:
 *   1. Hardcoded 6-digit hex colors                     (#1a2b3c)
 *   2. Arbitrary Tailwind COLOR values                  (bg-[#...], text-[#...])
 *   3. Arbitrary Tailwind FONT-SIZE values              (text-[13px], text-[0.8rem])
 *
 * A reskin should only ever touch tokens (globals.css + tailwind.config) and the
 * ui/ primitives; feature files should be free of the above. Run via
 * `npm run lint:design`. See docs/REDESIGN-PLAYBOOK.md.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

// Files/dirs allowed to contain raw color values because they ARE the source of
// truth or hold user-brand data (not app chrome).
const ALLOW = [
  "src/app/globals.css",
  "tailwind.config.ts",
  "src/lib/page-styles.ts", // per-page brand preset data (buyer-facing branding)
  "src/lib/pub-theme.ts", // published-page theme CSS vars (buyer-facing, like page-styles.ts)
  "src/lib/pub-color.ts", // pure color math deriving the buyer-facing ramp from user brand hex
  "src/lib/__tests__/pub-color.test.ts", // color-math test fixtures are hex by nature
  "src/lib/email.ts", // email HTML: CSS vars/Tailwind don't work in mail clients
  "src/lib/color-palettes.ts", // the swatch options a user picks page colors from
  "src/lib/ai-page-generation.ts", // LLM prompt vocab: hex is an example value shown to the model, not UI
  "src/components/ui/", // primitives legitimately map tokens → values
];

// Out of scope for the PRODUCT (app-chrome) design system:
//  - the marketing site is a separate, bespoke visual system, and
//  - the buyer-facing PUBLISHED-PAGE render surface is themed by the seller's
//    own brand settings (page-styles.ts + the --page-accent variable), not by
//    app-chrome tokens. Both are reskinned independently of the product UI.
const EXCLUDE = [
  "src/app/(marketing)/",
  "src/components/marketing/",
  "src/data/marketing/",
  // Buyer-facing published page + its gates/thumbnails:
  "src/app/p/",
  "src/app/preview/",
  "src/components/page-renderer.tsx",
  "src/components/page-shell.tsx",
  "src/components/pub-cover.tsx",
  "src/components/published-form.tsx",
  "src/components/tabbed-page-view.tsx",
  "src/components/page-thumbnail.tsx",
  // Editor renders the seller-branded page; the editor-only node tokens here
  // mirror the published renderer's light/dark values, not app chrome.
  "src/components/editor/extensions/",
  "src/components/editor/tiptap-editor.tsx",
];

const HEX = /#[0-9a-fA-F]{6}\b/;
const ARBITRARY_COLOR = /\b(?:bg|text|border|ring|fill|stroke|from|via|to|shadow|outline|decoration|divide|accent|caret)-\[#/;
const ARBITRARY_FONTSIZE = /\btext-\[(?:[0-9.]+(?:px|rem|em)|calc)/;

function isAllowed(rel) {
  return (
    ALLOW.some((a) => (a.endsWith("/") ? rel.startsWith(a) : rel === a)) ||
    EXCLUDE.some((e) => rel.startsWith(e))
  );
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if ([".ts", ".tsx"].includes(extname(name))) out.push(full);
  }
  return out;
}

const violations = [];
for (const file of walk(SRC)) {
  const rel = relative(ROOT, file);
  if (isAllowed(rel)) continue;
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    // Allow hex that is only a CSS-variable fallback, e.g. var(--page-accent, #003B22)
    const hexOffending = HEX.test(line) && !/var\(--[a-z-]+,\s*#[0-9a-fA-F]{6}/.test(line);
    if (hexOffending) violations.push([rel, i + 1, "hardcoded hex", line.trim()]);
    if (ARBITRARY_COLOR.test(line))
      violations.push([rel, i + 1, "arbitrary color", line.trim()]);
    if (ARBITRARY_FONTSIZE.test(line))
      violations.push([rel, i + 1, "arbitrary font-size", line.trim()]);
  });
}

if (violations.length === 0) {
  console.log("✅ design-tokens: no hardcoded colors or arbitrary size/color utilities in feature code.");
  process.exit(0);
}

console.error(`✖ design-tokens: ${violations.length} violation(s). Use tokens (globals.css / tailwind.config) or a ui/ primitive.\n`);
for (const [file, ln, kind, text] of violations) {
  const snippet = text.length > 100 ? text.slice(0, 100) + "…" : text;
  console.error(`  ${file}:${ln}  [${kind}]  ${snippet}`);
}
console.error(`\nSee docs/REDESIGN-PLAYBOOK.md for the allowed exceptions.`);
process.exit(1);
