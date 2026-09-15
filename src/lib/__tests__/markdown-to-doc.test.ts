import { describe, it, expect } from "vitest";
import { markdownToDoc, parseInline, type DocNode } from "@/lib/markdown-to-doc";
import { sanitizeDoc } from "@/lib/ai-page-generation";

const text = (t: string): DocNode => ({ type: "text", text: t });

describe("parseInline", () => {
  it("returns plain text untouched", () => {
    expect(parseInline("hello world")).toEqual([text("hello world")]);
  });

  it("marks bold, italic, and code", () => {
    expect(parseInline("a **b** c")).toEqual([
      text("a "),
      { type: "text", text: "b", marks: [{ type: "bold" }] },
      text(" c"),
    ]);
    expect(parseInline("*em* and _em_")).toEqual([
      { type: "text", text: "em", marks: [{ type: "italic" }] },
      text(" and "),
      { type: "text", text: "em", marks: [{ type: "italic" }] },
    ]);
    expect(parseInline("run `npm test`")).toEqual([
      text("run "),
      { type: "text", text: "npm test", marks: [{ type: "code" }] },
    ]);
  });

  it("nests marks inside links and bold", () => {
    expect(parseInline("[**Book**](https://x.io)")).toEqual([
      {
        type: "text",
        text: "Book",
        marks: [{ type: "link", attrs: { href: "https://x.io" } }, { type: "bold" }],
      },
    ]);
  });

  it("drops the link but keeps the text for unsafe schemes", () => {
    expect(parseInline("[x](javascript:alert)")).toEqual([text("x")]);
    expect(parseInline("[x](data:text/html,hi)")).toEqual([text("x")]);
    expect(parseInline("[mail](mailto:a@b.co)")).toEqual([
      { type: "text", text: "mail", marks: [{ type: "link", attrs: { href: "mailto:a@b.co" } }] },
    ]);
  });

  it("leaves unmatched delimiters and snake_case alone", () => {
    expect(parseInline("2 * 3 and a_b_c")).toEqual([text("2 * 3 and a_b_c")]);
    expect(parseInline("**unclosed")).toEqual([text("**unclosed")]);
    expect(parseInline("\\*not em\\*")).toEqual([text("*not em*")]);
  });
});

describe("markdownToDoc", () => {
  it("returns a single empty paragraph for empty input", () => {
    expect(markdownToDoc("")).toEqual({ type: "doc", content: [{ type: "paragraph" }] });
    expect(markdownToDoc("\n\n  \n")).toEqual({ type: "doc", content: [{ type: "paragraph" }] });
  });

  it("maps headings (clamped to level 3) and paragraphs", () => {
    const doc = markdownToDoc("# Title\n\nline one\nline two\n\n#### Deep");
    expect(doc.content).toEqual([
      { type: "heading", attrs: { level: 1 }, content: [text("Title")] },
      { type: "paragraph", content: [text("line one line two")] },
      { type: "heading", attrs: { level: 3 }, content: [text("Deep")] },
    ]);
  });

  it("builds bullet and ordered lists with one level of nesting", () => {
    const doc = markdownToDoc("- a\n  - a1\n- b\n\n1. one\n2. two");
    expect(doc.content).toEqual([
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [
              { type: "paragraph", content: [text("a")] },
              {
                type: "bulletList",
                content: [{ type: "listItem", content: [{ type: "paragraph", content: [text("a1")] }] }],
              },
            ],
          },
          { type: "listItem", content: [{ type: "paragraph", content: [text("b")] }] },
        ],
      },
      {
        type: "orderedList",
        content: [
          { type: "listItem", content: [{ type: "paragraph", content: [text("one")] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [text("two")] }] },
        ],
      },
    ]);
  });

  it("maps blockquotes, code fences, and rules", () => {
    const doc = markdownToDoc("> quoted\n> more\n\n```ts\nconst x = 1;\n```\n\n---");
    expect(doc.content).toEqual([
      { type: "blockquote", content: [{ type: "paragraph", content: [text("quoted more")] }] },
      { type: "codeBlock", content: [text("const x = 1;")] },
      { type: "horizontalRule" },
    ]);
  });

  it("maps pipe tables with a header row and pads short rows", () => {
    const doc = markdownToDoc("| Plan | Price |\n|---|---|\n| Pro | $29 |\n| Team |");
    expect(doc.content).toEqual([
      {
        type: "table",
        content: [
          {
            type: "tableRow",
            content: [
              { type: "tableHeader", content: [{ type: "paragraph", content: [text("Plan")] }] },
              { type: "tableHeader", content: [{ type: "paragraph", content: [text("Price")] }] },
            ],
          },
          {
            type: "tableRow",
            content: [
              { type: "tableCell", content: [{ type: "paragraph", content: [text("Pro")] }] },
              { type: "tableCell", content: [{ type: "paragraph", content: [text("$29")] }] },
            ],
          },
          {
            type: "tableRow",
            content: [
              { type: "tableCell", content: [{ type: "paragraph", content: [text("Team")] }] },
              { type: "tableCell", content: [{ type: "paragraph" }] },
            ],
          },
        ],
      },
    ]);
  });

  it("handles Windows line endings", () => {
    expect(markdownToDoc("# A\r\n\r\nb").content).toHaveLength(2);
  });

  it("produces a document the AI sanitizer accepts unchanged", () => {
    const md = [
      "# Proposal for Acme",
      "",
      "We propose a **3-month** pilot. See [pricing](https://x.io/p).",
      "",
      "- Kickoff",
      "- Rollout",
      "",
      "> Quote",
      "",
      "| A | B |",
      "|---|---|",
      "| 1 | 2 |",
      "",
      "```",
      "code",
      "```",
      "",
      "---",
    ].join("\n");
    const doc = markdownToDoc(md);
    expect(sanitizeDoc(doc)).toEqual(doc);
  });
});
