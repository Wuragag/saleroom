/**
 * Finds unfilled placeholders in a page before it goes out to a buyer.
 * Two shapes appear in practice:
 *   - AI drafts:  [PLACEHOLDER: annual license cost]
 *   - Templates:  [Company Name], [Your Title], [Date], [your@email.com]
 * Brackets must open with an uppercase letter (or "your") so citations like
 * [1] and casual [notes] don't trigger. Pure; used by the editor's publish
 * confirmation.
 */

const PLACEHOLDER_RE = /\[(?:PLACEHOLDER\b[^\]]*|(?:[A-Z]|your\b)[^\[\]\n]{0,79})\]/g;

export interface PlaceholderScan {
  /** Total occurrences across title, hero and every tab. */
  count: number;
  /** Up to three distinct examples, in document order. */
  samples: string[];
}

export function findPlaceholdersInText(text: string): string[] {
  return text.match(PLACEHOLDER_RE) ?? [];
}

type JsonNode = { type?: unknown; text?: unknown; attrs?: unknown; content?: unknown };

/**
 * Every human-visible string in a Tiptap doc: text nodes plus the string
 * attributes of atomic blocks (CTA labels, banner text, metric values,
 * contact names…), which is where template placeholders usually hide.
 */
// Attribute keys that hold URLs, ids or enums rather than buyer-visible text.
const NON_TEXT_ATTR = /^(href|src|url|link|photo|avatar|id|formId|syncedBlockId|level|height|bgStyle|provider|type|colwidth|colspan|rowspan|required)$/;

export function collectDocText(doc: unknown): string {
  const out: string[] = [];
  const visitAttr = (value: unknown) => {
    if (typeof value === "string") out.push(value);
    else if (Array.isArray(value)) value.forEach(visitAttr);
    else if (value && typeof value === "object") {
      for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
        if (!NON_TEXT_ATTR.test(key)) visitAttr(v);
      }
    }
  };
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const n = node as JsonNode;
    if (typeof n.text === "string") out.push(n.text);
    if (n.attrs && typeof n.attrs === "object") visitAttr(n.attrs);
    if (Array.isArray(n.content)) n.content.forEach(walk);
  };
  walk(doc);
  return out.join("\n");
}

export interface PlaceholderScanInput {
  title?: string | null;
  eyebrow?: string | null;
  subtitle?: string | null;
  tabs: { content: unknown }[];
}

export function findPagePlaceholders(input: PlaceholderScanInput): PlaceholderScan {
  const texts = [
    input.title ?? "",
    input.eyebrow ?? "",
    input.subtitle ?? "",
    ...input.tabs.map((t) => collectDocText(t.content)),
  ];
  const all = texts.flatMap(findPlaceholdersInText);
  const samples: string[] = [];
  for (const hit of all) {
    if (!samples.includes(hit)) samples.push(hit);
    if (samples.length === 3) break;
  }
  return { count: all.length, samples };
}
