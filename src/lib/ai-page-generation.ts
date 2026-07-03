import Anthropic from "@anthropic-ai/sdk";
import type { JSONContent } from "@tiptap/core";
import {
  FONT_OPTIONS,
  BACKGROUND_OPTIONS,
  WIDTH_OPTIONS,
  type PageStyle,
} from "./page-styles";

/**
 * Shared AI page-generation helpers, used by:
 * - POST /api/ai-chat/[pageId]  (Create with AI workspace)
 * - POST /api/import/process/[pageId]  (document import)
 */

export const AI_MODEL = "claude-haiku-4-5-20251001";
export const AI_MAX_TOKENS = 16384;

// ── Model call with retries ────────────────────────────────────────────────

/**
 * Calls Claude with exponential backoff on transient errors (429/503/529).
 * Returns the first text block of the response. Throws after retries.
 */
export async function callClaudeWithRetries(params: {
  system: string;
  messages: Anthropic.MessageParam[];
  maxTokens?: number;
}): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const MAX_RETRIES = 3;
  let message: Anthropic.Message | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      message = await anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: params.maxTokens ?? AI_MAX_TOKENS,
        system: params.system,
        messages: params.messages,
      });
      break;
    } catch (retryErr: unknown) {
      const status = (retryErr as { status?: number })?.status;
      const isRetryable = status === 429 || status === 529 || status === 503;

      if (!isRetryable || attempt === MAX_RETRIES - 1) throw retryErr;

      // Wait before retrying: 2s, 4s, 8s
      const delay = Math.pow(2, attempt + 1) * 1000;
      console.log(
        `Anthropic API returned ${status}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  if (!message) throw new Error("No response from AI after retries");

  return message.content[0]?.type === "text" ? message.content[0].text : "";
}

// ── Robust JSON extraction ─────────────────────────────────────────────────

/**
 * Extracts a JSON object from model output — handles code fences (complete
 * and truncated), preamble text, and trailing prose.
 */
export function extractJson(text: string): Record<string, unknown> | null {
  let str = text.trim();

  // Strip code fences: handle both complete (```json...```) and truncated (```json... no closing)
  if (str.startsWith("```")) {
    const firstNewline = str.indexOf("\n");
    if (firstNewline !== -1) str = str.slice(firstNewline + 1);
  }
  if (str.endsWith("```")) {
    str = str.slice(0, -3);
  }
  str = str.trim();

  // 1. Try parsing directly
  try {
    return JSON.parse(str);
  } catch {
    // 2. Try to find the outermost JSON object { ... }
    const firstBrace = str.indexOf("{");
    const lastBrace = str.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(str.slice(firstBrace, lastBrace + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

// ── Tiptap vocabulary shared by all generation prompts ─────────────────────

const STANDARD_NODES_SPEC = `Supported Tiptap node types you can use:
- heading: { "type": "heading", "attrs": { "level": 1|2|3 }, "content": [{ "type": "text", "text": "..." }] }
- paragraph: { "type": "paragraph", "content": [{ "type": "text", "text": "..." }] }
- bulletList: contains listItem children
- orderedList: contains listItem children
- listItem: { "type": "listItem", "content": [{ "type": "paragraph", "content": [...] }] }
- blockquote: contains paragraph children
- table: contains tableRow children
- tableRow: contains tableHeader or tableCell children
- tableHeader: { "type": "tableHeader", "content": [{ "type": "paragraph", "content": [...] }] }
- tableCell: { "type": "tableCell", "content": [{ "type": "paragraph", "content": [...] }] }
- horizontalRule: { "type": "horizontalRule" }
- codeBlock: { "type": "codeBlock", "content": [{ "type": "text", "text": "..." }] }

Supported text marks:
- bold: { "type": "text", "marks": [{ "type": "bold" }], "text": "..." }
- italic: { "type": "text", "marks": [{ "type": "italic" }], "text": "..." }
- link: { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "..." } }], "text": "..." }
- code: { "type": "text", "marks": [{ "type": "code" }], "text": "..." }`;

const CUSTOM_BLOCKS_SPEC = `Rich sales-page blocks (atomic nodes — no "content" key, only "attrs"):
- ctaButton: { "type": "ctaButton", "attrs": { "label": "Book a demo", "url": "https://..." } } — primary call-to-action button
- testimonial: { "type": "testimonial", "attrs": { "quote": "...", "author": "Jane Doe", "role": "VP Sales, Acme", "avatar": "" } } — leave avatar empty
- metrics: { "type": "metrics", "attrs": { "metrics": [{ "value": "99%", "label": "Uptime" }, ...] } } — 2 to 4 stat cards, 3 recommended
- banner: { "type": "banner", "attrs": { "text": "...", "emoji": "🎉", "bgStyle": "accent", "link": "", "linkLabel": "Learn more →" } } — bgStyle is "accent" | "subtle" | "warning"
- spacer: { "type": "spacer", "attrs": { "height": "md" } } — height is "sm" | "md" | "lg" | "xl"
- contactCard: { "type": "contactCard", "attrs": { "contacts": [{ "id": "c1", "name": "...", "title": "...", "email": "...", "phone": "", "photo": "" }] } } — leave photo empty
- formBlock: { "type": "formBlock", "attrs": { "formId": "", "fields": [{ "id": "f1", "type": "text", "label": "Name", "required": true }], "submitLabel": "Submit", "successMessage": "Thanks! We'll be in touch." } } — field type is "text" | "email" | "phone" | "textarea"
- logoGrid: { "type": "logoGrid", "attrs": { "logos": [{ "src": "https://...", "alt": "..." }] } } — ONLY when the user supplies real image URLs
- embed: { "type": "embed", "attrs": { "src": "https://...", "provider": "generic" } } — ONLY when the user supplies a real embed URL

Never use: syncedBlock, image.`;

/** Full node/mark vocabulary (standard + custom blocks) for prompts. */
export const TIPTAP_SPEC = `${STANDARD_NODES_SPEC}

${CUSTOM_BLOCKS_SPEC}`;

// ── System prompts ─────────────────────────────────────────────────────────

/** Document import: raw extracted text → Tiptap JSON. Behavior unchanged. */
export function buildImportSystemPrompt(): string {
  return `You are a document-to-Tiptap converter. You receive raw text extracted from a document (PDF, DOCX, or PPTX) and must convert it into a Tiptap-compatible JSON structure.

Your output MUST be valid JSON with this exact shape:
{
  "title": "Short descriptive title inferred from the document",
  "content": {
    "type": "doc",
    "content": [ ... ]
  }
}

${STANDARD_NODES_SPEC}

Rules:
1. Infer a short, descriptive title from the document content (max 80 characters).
2. Preserve the document's structure: headings, lists, tables, paragraphs.
3. Clean up extraction artifacts (extra whitespace, page numbers, headers/footers).
4. If the document has clear sections, use heading nodes to separate them.
5. Return ONLY the JSON object — no markdown, no code fences, no explanation.
6. Every paragraph and heading must have a "content" array with at least one text node. Empty paragraphs should have no "content" key or an empty array.`;
}

export const STYLE_VOCAB = `Page style options (only these values are valid):
- font: ${FONT_OPTIONS.map((o) => `"${o.value}"`).join(" | ")}
- accentColor: a hex color like "#7c3aed"
- background: ${BACKGROUND_OPTIONS.map((o) => `"${o.value}"`).join(" | ")}
- layoutWidth: ${WIDTH_OPTIONS.map((o) => `"${o.value}"`).join(" | ")}
- tabPlacement: "top" | "left"`;

// ── Sanitization ───────────────────────────────────────────────────────────

const ALLOWED_NODES = new Set([
  "doc",
  "paragraph",
  "heading",
  "text",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "table",
  "tableRow",
  "tableHeader",
  "tableCell",
  "horizontalRule",
  "codeBlock",
  "hardBreak",
  // custom blocks
  "ctaButton",
  "testimonial",
  "metrics",
  "banner",
  "spacer",
  "contactCard",
  "formBlock",
  "logoGrid",
  "embed",
  // Only survives sanitization with an explicitly whitelisted id (see
  // SanitizeDocOptions.allowedSyncedBlockIds) — dropped otherwise.
  "syncedBlock",
]);

const ALLOWED_MARKS = new Set([
  "bold",
  "italic",
  "strike",
  "code",
  "link",
  "textStyle",
]);

const MAX_DOC_CHARS = 300_000;

function isHttpUrl(value: unknown): boolean {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim());
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export interface SanitizeDocOptions {
  /** syncedBlock nodes survive only when their id is in this set. */
  allowedSyncedBlockIds?: Set<string>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function sanitizeNode(node: any, opts?: SanitizeDocOptions): any | null {
  if (!node || typeof node !== "object" || typeof node.type !== "string") {
    return null;
  }
  if (!ALLOWED_NODES.has(node.type)) return null;

  const out: any = { type: node.type };

  // Attrs: pass through with per-node fixes
  if (node.attrs && typeof node.attrs === "object") {
    out.attrs = { ...node.attrs };
  }
  switch (node.type) {
    case "heading": {
      const level = Number(out.attrs?.level);
      out.attrs = { level: Math.min(3, Math.max(1, isNaN(level) ? 2 : level)) };
      break;
    }
    case "syncedBlock": {
      const id = String(out.attrs?.syncedBlockId ?? "");
      if (!id || !opts?.allowedSyncedBlockIds?.has(id)) return null;
      out.attrs = {
        syncedBlockId: id,
        blockName: String(out.attrs?.blockName ?? "").slice(0, 100),
      };
      break;
    }
    case "embed":
      if (!isHttpUrl(out.attrs?.src)) return null;
      break;
    case "logoGrid": {
      const logos = Array.isArray(out.attrs?.logos)
        ? out.attrs.logos.filter((l: any) => isHttpUrl(l?.src))
        : [];
      if (logos.length === 0) return null;
      out.attrs = { logos };
      break;
    }
    case "contactCard": {
      const contacts = Array.isArray(out.attrs?.contacts)
        ? out.attrs.contacts
            .filter((c: any) => c && typeof c === "object")
            .map((c: any) => ({
              id: typeof c.id === "string" && c.id ? c.id : randomId(),
              name: String(c.name ?? ""),
              title: String(c.title ?? ""),
              email: String(c.email ?? ""),
              phone: String(c.phone ?? ""),
              photo: isHttpUrl(c.photo) ? c.photo : "",
            }))
        : [];
      out.attrs = { contacts };
      break;
    }
    case "formBlock": {
      const FIELD_TYPES = new Set(["text", "email", "phone", "textarea"]);
      const fields = Array.isArray(out.attrs?.fields)
        ? out.attrs.fields
            .filter((f: any) => f && typeof f === "object")
            .map((f: any) => ({
              id: typeof f.id === "string" && f.id ? f.id : randomId(),
              type: FIELD_TYPES.has(f.type) ? f.type : "text",
              label: String(f.label ?? "Field"),
              required: !!f.required,
            }))
        : [];
      out.attrs = {
        formId: "",
        fields,
        submitLabel: String(out.attrs?.submitLabel ?? "Submit"),
        successMessage: String(out.attrs?.successMessage ?? "Thanks!"),
      };
      break;
    }
  }

  // Text nodes: text + filtered marks only
  if (node.type === "text") {
    if (typeof node.text !== "string" || node.text.length === 0) return null;
    out.text = node.text;
    if (Array.isArray(node.marks)) {
      const marks = node.marks
        .filter(
          (m: any) =>
            m && typeof m.type === "string" && ALLOWED_MARKS.has(m.type)
        )
        .filter((m: any) => m.type !== "link" || isHttpUrl(m.attrs?.href))
        .map((m: any) =>
          m.type === "link"
            ? { type: "link", attrs: { href: m.attrs.href } }
            : { type: m.type, ...(m.attrs ? { attrs: m.attrs } : {}) }
        );
      if (marks.length > 0) out.marks = marks;
    }
    return out;
  }

  // Children
  if (Array.isArray(node.content)) {
    const children = node.content
      .map((c: any) => sanitizeNode(c, opts))
      .filter((c: unknown) => c !== null);
    if (children.length > 0) out.content = children;
  }

  return out;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Recursively whitelists a model-produced Tiptap doc. Unknown node types and
 * marks are dropped (a single unknown node type would otherwise make TipTap
 * silently blank the whole document on setContent). Returns null when the
 * input isn't a doc or exceeds the size cap.
 */
export function sanitizeDoc(
  doc: unknown,
  opts?: SanitizeDocOptions
): JSONContent | null {
  if (!doc || typeof doc !== "object") return null;
  if ((doc as { type?: string }).type !== "doc") return null;

  try {
    if (JSON.stringify(doc).length > MAX_DOC_CHARS) return null;
  } catch {
    return null;
  }

  const clean = sanitizeNode(doc, opts);
  if (!clean || clean.type !== "doc") return null;
  // A doc must have at least one block
  if (!Array.isArray(clean.content) || clean.content.length === 0) {
    clean.content = [{ type: "paragraph" }];
  }
  return clean as JSONContent;
}

const VALID_FONTS = new Set(FONT_OPTIONS.map((o) => o.value));
const VALID_BACKGROUNDS = new Set(BACKGROUND_OPTIONS.map((o) => o.value));
const VALID_WIDTHS = new Set(WIDTH_OPTIONS.map((o) => o.value));
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/**
 * Whitelists a model-produced style patch against the real style vocabulary.
 * Never accepts logoUrl (or any unknown field).
 */
export function sanitizeStylePatch(patch: unknown): Partial<PageStyle> {
  if (!patch || typeof patch !== "object") return {};
  const p = patch as Record<string, unknown>;
  const out: Partial<PageStyle> = {};

  if (typeof p.font === "string" && VALID_FONTS.has(p.font)) out.font = p.font;
  if (typeof p.accentColor === "string" && HEX_RE.test(p.accentColor)) {
    out.accentColor = p.accentColor;
  }
  if (typeof p.background === "string" && VALID_BACKGROUNDS.has(p.background)) {
    out.background = p.background;
  }
  if (typeof p.layoutWidth === "string" && VALID_WIDTHS.has(p.layoutWidth)) {
    out.layoutWidth = p.layoutWidth;
  }
  if (p.tabPlacement === "top" || p.tabPlacement === "left") {
    out.tabPlacement = p.tabPlacement;
  }
  return out;
}
