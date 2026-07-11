import type { JSONContent } from "@tiptap/core";
import type { PageStyle } from "./page-styles";
import type {
  ComposerPlan,
  ComposerMapItemInput,
  ComposerOp,
  PlanTabSpec,
  EditTabContext,
} from "@/types/ai-composer";
import { TIPTAP_SPEC, STYLE_VOCAB, sanitizeDoc, sanitizeStylePatch } from "./ai-page-generation";
import { APP_NAME } from "./constants";

/**
 * Server-side brain of the sales-page composer: the shared writing rules,
 * the page-type library that grounds planning, the per-phase system prompts,
 * and the sanitizers that make model output safe to apply.
 */

// ── Shared writing rules ────────────────────────────────────────────────────

export const SALES_COMPOSER_RULES = `You compose buyer-facing SALES PAGES that a seller sends to a specific buyer mid-deal. These are not marketing landing pages and not generic websites.

Writing rules:
1. Concise and specific. Short paragraphs (2-3 sentences max), bullets over prose. Every sentence must earn its place.
2. Banned words and their kin: "cutting-edge", "revolutionize", "unlock", "seamless", "game-changing", "empower", "leverage", "supercharge", "next-level", "world-class".
3. NEVER invent facts: no fake metrics, prices, customer names, dates, or quotes. When a real value is unknown, write [PLACEHOLDER: what is needed, e.g. "annual license cost"] and report it in missingInfo.
4. Role-aware language: for a CFO lead with payback period, risk, and cost of inaction; for a champion keep it short, forwardable, "what to tell your boss"; for procurement/security cover compliance posture, process, and required artifacts.
5. Purpose of every page: help the buyer understand the value, share the page internally, and see the obvious next step. Reduce back-and-forth.
6. Use blocks purposefully:
   - ONE primary ctaButton per page, on the designated CTA tab, with a specific action label ("Book the technical validation call", never "Learn more").
   - metrics only for real numbers or explicitly placeholder-flagged ones.
   - banner for the single most important takeaway or deadline.
   - testimonial only with real quotes from the conversation, or an explicit placeholder.
   - contactCard for the seller's own contacts. spacer for visual rhythm.
7. Each tab starts with one clear heading matching its job. No filler intros ("In today's fast-paced world...").`;

// ── Page-type library (grounding for the planner) ──────────────────────────

export const PAGE_TYPE_LIBRARY = `Known sales page types and their proven structures (adapt to the request — don't copy blindly):
- call-recap — after a discovery/intro call. Tabs: [Recap]. MAP: optional.
- post-demo-follow-up — after a demo; align internal stakeholders, drive the next step. Tabs: [Recap, Recommended Solution, Business Case, Next Steps]. MAP: yes.
- proposal — formal offer. Tabs: [Overview, Solution, Pricing, Proof, Next Steps]. MAP: yes.
- mutual-action-plan — the plan IS the page. Tabs: [Overview]. MAP: yes (rich item list).
- battle-card — competitive positioning for a champion. Tabs: [Why Us, Proof, Pricing]. MAP: no.
- onboarding — welcome a new customer. Tabs: [Welcome, Getting Started]. MAP: yes (implementation milestones).
- qbr — quarterly business review. Tabs: [Results, Wins, Next Quarter, Renewal]. MAP: optional.
- executive-one-pager — for a busy exec sponsor. Tabs: [Summary]. MAP: no.
- roi-case-study — evidence page. Tabs: [Challenge, Solution, Results]. MAP: no.
- procurement-security-follow-up — unblock legal/security review. Tabs: [Process & Timeline, Security & Compliance, Documents, Next Steps]. MAP: yes.
- champion-enablement — help your champion sell internally. Tabs: [The Pitch, Why Now, FAQ]. MAP: no.`;

// ── Prompt builders ─────────────────────────────────────────────────────────

export function buildPlanSystemPrompt(ctx: {
  title: string;
  style: Partial<PageStyle>;
  maxTabs: number;
}): string {
  return `You are the planning brain of a sales-page composer inside ${APP_NAME}. The user describes a page; you infer the sales context and return a build plan. A separate step writes each tab afterwards.

Infer from the conversation: what type of page this is, who the buyer/persona is, what stage the deal is in, what the buyer should do next, and what source material the user provided.

${PAGE_TYPE_LIBRARY}

${SALES_COMPOSER_RULES}

${STYLE_VOCAB}

Your output MUST be ONLY a valid JSON object (no markdown, no code fences):
{
  "reply": "2-4 sentences, first person, confident: what you'll build and why it fits the buyer journey. End with the structure, e.g. 'I'll use 4 tabs: Recap, Recommended Solution, Business Case, and Next Steps, plus a Mutual Action Plan and a CTA to book the pricing call.'",
  "plan": {
    "pageType": "one of the library ids (or closest fit)",
    "title": "Buyer-facing page title (max 80 chars, e.g. 'Acme + ${APP_NAME} — Next Steps')",
    "style": { ... },                     // OPTIONAL, only when a look clearly fits
    "tabs": [{ "name": "Recap", "purpose": "One line: what this tab must accomplish for the buyer" }],
    "ctaTabName": "Next Steps",           // tab carrying the ONE primary CTA, or null
    "cta": { "label": "Book the technical validation call", "url": "" },  // or null
    "includeMap": true,
    "mapTitle": "Path to go-live",        // when includeMap
    "mapItems": [{ "title": "...", "ownerType": "seller"|"buyer", "ownerName": "", "dueDateOffsetDays": 7 }],
    "missingInfo": ["Specific facts you could not find and will placeholder"],
    "suggestions": ["Make it more executive-friendly", ...]  // 3-5 short follow-up actions for AFTER the build
  }
}

Rules:
- At most ${ctx.maxTabs} tabs. Fewer is better than padded.
- Do NOT ask blocking questions — plan with the best interpretation, note unknowns in missingInfo, and proceed.
- mapItems: 4-8 concrete, dated steps alternating seller/buyer ownership where natural.
- Current page title: "${ctx.title}". Current style: ${JSON.stringify(ctx.style)}.`;
}

export function buildTabSystemPrompt(ctx: {
  plan: ComposerPlan;
  tabSpec: PlanTabSpec;
  builtTabs: { name: string; summary: string }[];
  style: Partial<PageStyle>;
  syncedBlocks: { id: string; name: string }[];
}): string {
  const syncedSection =
    ctx.syncedBlocks.length > 0
      ? `Reusable team blocks — you may reference one where it genuinely fits with { "type": "syncedBlock", "attrs": { "syncedBlockId": "<id>", "blockName": "<name>" } }. ONLY these ids are valid:
${ctx.syncedBlocks.map((b) => `- ${b.id} — "${b.name}"`).join("\n")}`
      : `Never use: syncedBlock.`;

  const builtSection =
    ctx.builtTabs.length > 0
      ? `Tabs already written (do NOT repeat their content):
${ctx.builtTabs.map((t) => `- ${t.name}: ${t.summary}`).join("\n")}`
      : "This is the first tab.";

  const ctaRule =
    ctx.plan.ctaTabName === ctx.tabSpec.name && ctx.plan.cta
      ? `This tab carries the page's ONE primary CTA: include a ctaButton with label "${ctx.plan.cta.label}"${ctx.plan.cta.url ? ` and url "${ctx.plan.cta.url}"` : ' (url "" if none was provided)'}.`
      : `Do NOT add a ctaButton here — the primary CTA lives on the "${ctx.plan.ctaTabName ?? "(none)"}" tab.`;

  return `You write ONE tab of a sales page. The plan and the already-written tabs are below — your job is only the "${ctx.tabSpec.name}" tab.

Page plan: ${JSON.stringify({ pageType: ctx.plan.pageType, title: ctx.plan.title, tabs: ctx.plan.tabs, missingInfo: ctx.plan.missingInfo })}
This tab's job: ${ctx.tabSpec.purpose}
${builtSection}
${ctaRule}

${SALES_COMPOSER_RULES}

${TIPTAP_SPEC}

${syncedSection}

Your output MUST be ONLY a valid JSON object (no markdown, no code fences):
{
  "content": { "type": "doc", "content": [ ...Tiptap nodes for this tab only... ] },
  "summary": "One line describing what this tab now covers"
}`;
}

export function buildEditSystemPrompt(ctx: {
  title: string;
  style: Partial<PageStyle>;
  activeTabId: string;
  tabsInventoryJson: string;
  mapJson: string;
  syncedBlocks: { id: string; name: string }[];
}): string {
  const syncedSection =
    ctx.syncedBlocks.length > 0
      ? `Reusable team blocks (syncedBlock nodes) — ONLY these ids are valid:
${ctx.syncedBlocks.map((b) => `- ${b.id} — "${b.name}"`).join("\n")}`
      : `Never use: syncedBlock.`;

  return `You are a sales-page editor inside ${APP_NAME}. The user asks for changes; you return the MINIMUM set of operations that fulfils the request. Never regenerate tabs the request doesn't affect — the user is steering the page, not starting over.

Operations you can return (use real tabIds from the inventory):
- { "op": "updateTab", "tabId": "...", "content": { "type": "doc", ... } } — FULLY REPLACES that tab, so return the complete revised doc, but only for tabs the request touches.
- { "op": "renameTab", "tabId": "...", "name": "..." }
- { "op": "addTab", "name": "...", "content": { "type": "doc", ... } }
- { "op": "setTitle", "title": "..." }
- { "op": "setStyle", "style": { ... } }
- { "op": "setMap", "title"?: "...", "closeDate"?: "ISO date"|null, "items"?: [{ "title", "ownerType": "seller"|"buyer", "ownerName"?, "dueDateOffsetDays"? }] } — items REPLACE the list, so include unchanged items you want to keep.
- { "op": "removeMap" }

Scoping examples:
- "Make this more CFO-friendly" → updateTab only on the executive-summary/business-case-like tabs (tighter copy, payback, risk, cost of inaction).
- "Make it shorter" → updateTab on verbose tabs, trimming low-value sections; do not touch tabs that are already tight.
- "Add urgency" → updateTab on the next-steps/CTA tab; maybe a banner with the key date.
- "Prepare this for procurement" → addTab for security/legal/process if missing; leave the rest alone.
- A pure question → no ops at all, just answer in reply.

${SALES_COMPOSER_RULES}

${TIPTAP_SPEC}

${STYLE_VOCAB}

${syncedSection}

CURRENT PAGE STATE
Title: ${ctx.title}
Style: ${JSON.stringify(ctx.style)}
Active tab id: ${ctx.activeTabId}
Tabs inventory:
${ctx.tabsInventoryJson}
Mutual Action Plan: ${ctx.mapJson}

Your output MUST be ONLY a valid JSON object (no markdown, no code fences):
{
  "reply": "1-2 short sentences on what you changed (or the answer to their question).",
  "ops": [ ... ],           // empty array when nothing should change
  "suggestions": ["...", ...]  // 3-5 short next-step chips
}`;
}

// ── Sanitizers ──────────────────────────────────────────────────────────────

const MAX_PLAN_TABS_HARD = 8;

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export function sanitizeMapItems(raw: unknown): ComposerMapItemInput[] {
  if (!Array.isArray(raw)) return [];
  const now = Date.now();
  return raw
    .filter((i): i is Record<string, unknown> => !!i && typeof i === "object")
    .slice(0, 12)
    .map((i) => {
      const offset = Number(i.dueDateOffsetDays);
      const hasOffset = Number.isFinite(offset) && offset >= 0 && offset <= 365;
      return {
        title: str(i.title, 200),
        ownerType: i.ownerType === "buyer" ? ("buyer" as const) : ("seller" as const),
        ownerName: str(i.ownerName, 100),
        dueDate: hasOffset
          ? new Date(now + Math.round(offset) * 86_400_000).toISOString()
          : null,
      };
    })
    .filter((i) => i.title.length > 0);
}

export function sanitizePlan(raw: unknown, maxTabs: number): ComposerPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;

  const tabCap = Math.min(
    maxTabs > 0 ? maxTabs : MAX_PLAN_TABS_HARD,
    MAX_PLAN_TABS_HARD
  );
  const tabs: PlanTabSpec[] = (Array.isArray(p.tabs) ? p.tabs : [])
    .filter((t): t is Record<string, unknown> => !!t && typeof t === "object")
    .map((t) => ({ name: str(t.name, 40), purpose: str(t.purpose, 200) }))
    .filter((t) => t.name.length > 0)
    .slice(0, tabCap);
  if (tabs.length === 0) return null;

  const title = str(p.title, 80);
  if (!title) return null;

  const rawCta =
    p.cta && typeof p.cta === "object" ? (p.cta as Record<string, unknown>) : null;
  const ctaLabel = rawCta ? str(rawCta.label, 60) : "";
  const cta = ctaLabel
    ? { label: ctaLabel, url: str(rawCta?.url, 500) || undefined }
    : null;

  const ctaTabNameRaw = str(p.ctaTabName, 40);
  const ctaTabName =
    cta && tabs.some((t) => t.name === ctaTabNameRaw)
      ? ctaTabNameRaw
      : cta
      ? tabs[tabs.length - 1].name // fall back to the last tab
      : null;

  const strings = (v: unknown, n: number, len: number) =>
    (Array.isArray(v) ? v : [])
      .map((s) => str(s, len))
      .filter(Boolean)
      .slice(0, n);

  return {
    pageType: str(p.pageType, 40) || "custom",
    title,
    style: sanitizeStylePatch(p.style),
    tabs,
    ctaTabName,
    cta,
    includeMap: p.includeMap === true,
    mapTitle: str(p.mapTitle, 100) || undefined,
    mapItems: sanitizeMapItems(p.mapItems),
    missingInfo: strings(p.missingInfo, 10, 120),
    suggestions: strings(p.suggestions, 5, 60),
  };
}

export function sanitizeSuggestions(raw: unknown): string[] {
  return (Array.isArray(raw) ? raw : [])
    .map((s) => str(s, 60))
    .filter(Boolean)
    .slice(0, 5);
}

export function sanitizeOps(
  raw: unknown,
  ctx: { validTabIds: Set<string>; allowedSyncedBlockIds: Set<string> }
): ComposerOp[] {
  if (!Array.isArray(raw)) return [];
  const out: ComposerOp[] = [];
  const docOpts = { allowedSyncedBlockIds: ctx.allowedSyncedBlockIds };

  for (const o of raw.slice(0, 12)) {
    if (!o || typeof o !== "object") continue;
    const op = o as Record<string, unknown>;
    switch (op.op) {
      case "updateTab": {
        const tabId = str(op.tabId, 64);
        const content = sanitizeDoc(op.content, docOpts);
        if (ctx.validTabIds.has(tabId) && content) {
          out.push({ op: "updateTab", tabId, content });
        }
        break;
      }
      case "renameTab": {
        const tabId = str(op.tabId, 64);
        const name = str(op.name, 40);
        if (ctx.validTabIds.has(tabId) && name) {
          out.push({ op: "renameTab", tabId, name });
        }
        break;
      }
      case "addTab": {
        const name = str(op.name, 40);
        const content = sanitizeDoc(op.content, docOpts);
        if (name && content) out.push({ op: "addTab", name, content });
        break;
      }
      case "setTitle": {
        const title = str(op.title, 200);
        if (title) out.push({ op: "setTitle", title });
        break;
      }
      case "setStyle": {
        const style = sanitizeStylePatch(op.style);
        if (Object.keys(style).length > 0) out.push({ op: "setStyle", style });
        break;
      }
      case "setMap": {
        const payload: Extract<ComposerOp, { op: "setMap" }> = { op: "setMap" };
        const title = str(op.title, 100);
        if (title) payload.title = title;
        if (op.closeDate === null) payload.closeDate = null;
        else {
          const cd = str(op.closeDate, 40);
          if (cd && !isNaN(Date.parse(cd))) {
            payload.closeDate = new Date(cd).toISOString();
          }
        }
        if (op.items !== undefined) payload.items = sanitizeMapItems(op.items);
        out.push(payload);
        break;
      }
      case "removeMap":
        out.push({ op: "removeMap" });
        break;
    }
  }
  return out;
}

// ── Edit-context budgeting ──────────────────────────────────────────────────

const ACTIVE_TAB_BUDGET = 60_000;
const OTHER_TAB_BUDGET = 25_000;
const TOTAL_BUDGET = 140_000;
const OVER_BUDGET_NOTE =
  "(content too large to include — ask the user to target this tab specifically)";

/**
 * Serializes the tab inventory for the edit prompt under deterministic size
 * budgets: active tab 60k chars, others 25k each, 140k total.
 */
export function buildTabsInventoryJson(
  tabs: EditTabContext[],
  activeTabId: string
): string {
  let spent = 0;
  const entries = tabs.map((t) => {
    const budget = t.id === activeTabId ? ACTIVE_TAB_BUDGET : OTHER_TAB_BUDGET;
    let content: JSONContent | string = OVER_BUDGET_NOTE;
    if (t.content) {
      try {
        const serialized = JSON.stringify(t.content);
        if (serialized.length <= budget && spent + serialized.length <= TOTAL_BUDGET) {
          content = t.content;
          spent += serialized.length;
        }
      } catch {
        /* keep the note */
      }
    } else {
      content = "(empty tab)";
    }
    return { id: t.id, name: t.name, active: t.id === activeTabId, content };
  });
  return JSON.stringify(entries);
}
