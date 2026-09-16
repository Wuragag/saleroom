/**
 * Markdown → Tiptap JSON, for callers that write page content as text (the
 * MCP `set_tab_content` / `create_page` tools). Deliberately a small, strict
 * subset — the point is a predictable mapping onto the block vocabulary the
 * editor and published renderer already understand (see TIPTAP_SPEC in
 * ai-page-generation.ts), not full CommonMark:
 *
 *   # / ## / ###      → heading (levels 1-3; deeper headings clamp to 3)
 *   - item / 1. item  → bulletList / orderedList (one level of nesting by indent)
 *   > quote           → blockquote
 *   ```lang           → codeBlock
 *   --- / ***         → horizontalRule
 *   | a | b |         → table (first row + `|---|` separator = header row)
 *   blank line        → paragraph break
 *   **bold** *em* `code` [text](https://…) → marks (links: http(s)/mailto only)
 *
 * Output is plain JSON; callers still run it through sanitizeDoc() before
 * persisting so the two paths can never disagree about what's allowed.
 */

export interface DocNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
}

const SAFE_HREF = /^(https?:\/\/|mailto:)/i;

// ── Inline marks ────────────────────────────────────────────────────────────

type Mark = { type: string; attrs?: Record<string, unknown> };

function textNode(text: string, marks: Mark[]): DocNode {
  return marks.length ? { type: "text", text, marks } : { type: "text", text };
}

/** Finds the closing delimiter for an inline span, or -1 (empty spans don't close). */
function findClose(src: string, from: number, delim: string): number {
  const idx = src.indexOf(delim, from);
  return idx === -1 || idx === from ? -1 : idx;
}

export function parseInline(src: string, marks: Mark[] = []): DocNode[] {
  const out: DocNode[] = [];
  let buf = "";
  const flush = () => {
    if (buf) out.push(textNode(buf, marks));
    buf = "";
  };

  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    const rest = src.slice(i);

    // Escaped character
    if (ch === "\\" && i + 1 < src.length) {
      buf += src[i + 1];
      i += 2;
      continue;
    }

    // Inline code — no nested parsing inside.
    if (ch === "`") {
      const close = findClose(src, i + 1, "`");
      if (close !== -1) {
        flush();
        out.push(textNode(src.slice(i + 1, close), [...marks, { type: "code" }]));
        i = close + 1;
        continue;
      }
    }

    // Link [text](href)
    if (ch === "[") {
      const m = /^\[([^\]]+)\]\(([^)\s]+)\)/.exec(rest);
      if (m) {
        flush();
        const href = m[2];
        const linkMarks = SAFE_HREF.test(href)
          ? [...marks, { type: "link", attrs: { href } }]
          : marks; // unsafe scheme → keep the text, drop the link
        out.push(...parseInline(m[1], linkMarks));
        i += m[0].length;
        continue;
      }
    }

    // Bold **x** or __x__
    if (rest.startsWith("**") || rest.startsWith("__")) {
      const delim = rest.slice(0, 2);
      const close = findClose(src, i + 2, delim);
      if (close !== -1) {
        flush();
        out.push(...parseInline(src.slice(i + 2, close), [...marks, { type: "bold" }]));
        i = close + 2;
        continue;
      }
    }

    // Italic *x* or _x_ (underscore only at a word boundary so snake_case survives)
    if (ch === "*" || (ch === "_" && (i === 0 || /\s/.test(src[i - 1])))) {
      const close = findClose(src, i + 1, ch);
      const inner = close !== -1 ? src.slice(i + 1, close) : "";
      if (close !== -1 && inner.trim() && !/^\s/.test(inner)) {
        flush();
        out.push(...parseInline(inner, [...marks, { type: "italic" }]));
        i = close + 1;
        continue;
      }
    }

    buf += ch;
    i++;
  }
  flush();
  return out;
}

// ── Blocks ──────────────────────────────────────────────────────────────────

function paragraph(text: string): DocNode {
  const content = parseInline(text.trim());
  return content.length ? { type: "paragraph", content } : { type: "paragraph" };
}

const HEADING_RE = /^(#{1,6})\s+(.*)$/;
const RULE_RE = /^\s*([-*_])(\s*\1){2,}\s*$/;
const BULLET_RE = /^(\s*)[-*+]\s+(.*)$/;
const ORDERED_RE = /^(\s*)\d+[.)]\s+(.*)$/;
const QUOTE_RE = /^>\s?(.*)$/;
const FENCE_RE = /^```/;
const TABLE_ROW_RE = /^\s*\|.*\|\s*$/;
const TABLE_SEP_RE = /^\s*\|?(\s*:?-+:?\s*\|)+\s*:?-*:?\s*\|?\s*$/;

function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((c) => c.trim());
}

interface ListLine {
  indent: number;
  ordered: boolean;
  text: string;
}

function parseListLine(line: string): ListLine | null {
  const b = BULLET_RE.exec(line);
  if (b) return { indent: b[1].length, ordered: false, text: b[2] };
  const o = ORDERED_RE.exec(line);
  if (o) return { indent: o[1].length, ordered: true, text: o[2] };
  return null;
}

/** Builds a (possibly nested) list from consecutive list lines. */
function buildList(lines: ListLine[]): DocNode {
  const base = lines[0].indent;
  const list: DocNode = {
    type: lines[0].ordered ? "orderedList" : "bulletList",
    content: [],
  };
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const item: DocNode = { type: "listItem", content: [paragraph(line.text)] };
    i++;
    // Gather deeper-indented lines as a nested list.
    const nested: ListLine[] = [];
    while (i < lines.length && lines[i].indent > base) {
      nested.push(lines[i]);
      i++;
    }
    if (nested.length) item.content!.push(buildList(nested));
    list.content!.push(item);
  }
  return list;
}

export function markdownToDoc(markdown: string): DocNode {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: DocNode[] = [];
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) {
      blocks.push(paragraph(para.join(" ")));
      para = [];
    }
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      flushPara();
      i++;
      continue;
    }

    if (FENCE_RE.test(line)) {
      flushPara();
      const code: string[] = [];
      i++;
      while (i < lines.length && !FENCE_RE.test(lines[i])) {
        code.push(lines[i]);
        i++;
      }
      i++; // closing fence (or EOF)
      blocks.push({
        type: "codeBlock",
        content: code.length ? [{ type: "text", text: code.join("\n") }] : undefined,
      });
      continue;
    }

    const heading = HEADING_RE.exec(line);
    if (heading) {
      flushPara();
      blocks.push({
        type: "heading",
        attrs: { level: Math.min(heading[1].length, 3) },
        content: parseInline(heading[2].trim()),
      });
      i++;
      continue;
    }

    if (RULE_RE.test(line)) {
      flushPara();
      blocks.push({ type: "horizontalRule" });
      i++;
      continue;
    }

    if (QUOTE_RE.test(line)) {
      flushPara();
      const quoted: string[] = [];
      while (i < lines.length && QUOTE_RE.test(lines[i])) {
        quoted.push(QUOTE_RE.exec(lines[i])![1]);
        i++;
      }
      // Blank quoted lines split paragraphs inside the quote.
      const inner = markdownToDoc(quoted.join("\n")).content ?? [];
      blocks.push({
        type: "blockquote",
        content: inner.length ? inner : [{ type: "paragraph" }],
      });
      continue;
    }

    if (TABLE_ROW_RE.test(line) && i + 1 < lines.length && TABLE_SEP_RE.test(lines[i + 1])) {
      flushPara();
      const header = splitTableRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && TABLE_ROW_RE.test(lines[i])) {
        rows.push(splitTableRow(lines[i]));
        i++;
      }
      const cell = (type: "tableHeader" | "tableCell", text: string): DocNode => ({
        type,
        content: [paragraph(text)],
      });
      const width = header.length;
      const pad = (cells: string[]) =>
        Array.from({ length: width }, (_, c) => cells[c] ?? "");
      blocks.push({
        type: "table",
        content: [
          { type: "tableRow", content: header.map((h) => cell("tableHeader", h)) },
          ...rows.map((r) => ({
            type: "tableRow",
            content: pad(r).map((c) => cell("tableCell", c)),
          })),
        ],
      });
      continue;
    }

    const listLine = parseListLine(line);
    if (listLine) {
      flushPara();
      const group: ListLine[] = [];
      while (i < lines.length) {
        const l = parseListLine(lines[i]);
        if (!l) break;
        group.push(l);
        i++;
      }
      blocks.push(buildList(group));
      continue;
    }

    para.push(line.trim());
    i++;
  }
  flushPara();

  return { type: "doc", content: blocks.length ? blocks : [{ type: "paragraph" }] };
}
