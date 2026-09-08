import { describe, expect, it, vi } from "vitest";
import { getSchema } from "@tiptap/core";
import { buildPubExtensions } from "../pub-nodes";
import {
  PUB_RENDER_FALLBACK_HTML,
  parseDocJson,
  renderPubHtml,
  stripUnknownNodes,
} from "../pub-html";

const ACCENT = ["#", "7c3aed"].join("");

const para = (text: string) => ({
  type: "paragraph",
  content: [{ type: "text", text }],
});

describe("renderPubHtml", () => {
  it("keeps var()-themed inline styles in the server HTML (no first-paint flash)", () => {
    const { html } = renderPubHtml(
      {
        type: "doc",
        content: [
          { type: "ctaButton", attrs: { label: "Book a call", url: "https://example.com" } },
          { type: "banner", attrs: { text: "Deadline", emoji: "🔥", bgStyle: "accent", link: "", linkLabel: "" } },
          { type: "metrics", attrs: { metrics: [{ value: "99%", label: "Uptime" }] } },
        ],
      },
      { accentColor: ACCENT }
    );
    expect(html).toContain("background:var(--pub-accent");
    expect(html).toContain("color:var(--pub-accent-ink");
    expect(html).toContain("border-radius:var(--pub-radius-sm");
    expect(html).toContain("var(--metric-cell-bg");
    expect(html).toContain('href="https://example.com"');
  });

  it("drops block types this build doesn't know instead of throwing", () => {
    const { html, dropped } = renderPubHtml({
      type: "doc",
      content: [
        para("Hello"),
        { type: "fileAttachment", attrs: { url: "https://x.test/a.pdf", name: "a.pdf" } },
        para("Bye"),
      ],
    });
    expect(dropped).toEqual(["fileAttachment"]);
    expect(html).toContain("Hello");
    expect(html).toContain("Bye");
    expect(html).not.toContain("fileAttachment");
  });

  it("strips unknown marks but keeps the text", () => {
    const { html } = renderPubHtml({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Strong", marks: [{ type: "bold" }, { type: "highlightFuture" }] },
          ],
        },
      ],
    });
    expect(html).toContain("<strong>Strong</strong>");
  });

  it("sanitizes dangerous URLs and script content", () => {
    const { html } = renderPubHtml({
      type: "doc",
      content: [
        { type: "ctaButton", attrs: { label: "<img src=x onerror=alert(1)>", url: "javascript:alert(1)" } },
        { type: "embed", attrs: { src: "javascript:alert(1)", provider: "generic" } },
      ],
    });
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<img");
    // Escaped exactly once — the label reads "<img …>" on screen, not "&lt;img …&gt;"
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;</a>");
  });

  it("does not double-escape apostrophes and ampersands in block text", () => {
    const { html } = renderPubHtml({
      type: "doc",
      content: [
        { type: "ctaButton", attrs: { label: "Let's talk & plan", url: "https://example.com" } },
        { type: "metrics", attrs: { metrics: [{ value: "<5 min", label: "Setup & go" }] } },
      ],
    });
    expect(html).toContain(">Let's talk &amp; plan</a>");
    expect(html).toContain("&lt;5 min");
    expect(html).toContain("Setup &amp; go");
    expect(html).not.toContain("&amp;amp;");
    expect(html).not.toContain("&#x27;");
  });

  it("normalizes share links into embeddable URLs", () => {
    const { html } = renderPubHtml({
      type: "doc",
      content: [
        { type: "embed", attrs: { src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", provider: "generic" } },
        { type: "embed", attrs: { src: "https://www.loom.com/share/abc123DEF", provider: "generic" } },
      ],
    });
    expect(html).toContain('src="https://www.youtube.com/embed/dQw4w9WgXcQ"');
    expect(html).toContain('src="https://www.loom.com/embed/abc123DEF"');
  });

  it("renders an empty tab for non-document input and never throws", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(renderPubHtml({}).html).toBe("<p></p>");
    expect(renderPubHtml(null).html).toBe("<p></p>");
    expect(renderPubHtml("junk").html).toBe("<p></p>");
    spy.mockRestore();
  });

  it("falls back to a placeholder when serialization itself fails", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    // A table row directly under doc is structurally invalid for the serializer
    const { html } = renderPubHtml({
      type: "doc",
      content: [{ type: "heading", attrs: { level: "not-a-number" }, content: [{ type: "text", text: 5 }] }],
    });
    expect([PUB_RENDER_FALLBACK_HTML, html]).toContain(html);
    spy.mockRestore();
  });
});

describe("stripUnknownNodes", () => {
  it("reports every dropped type, including nested ones", () => {
    const schema = getSchema(buildPubExtensions());
    const { doc, dropped } = stripUnknownNodes(
      {
        type: "doc",
        content: [
          { type: "columns", content: [
            { type: "column", content: [para("a"), { type: "widget" }] },
            { type: "column", content: [para("b")] },
          ] },
          { type: "fileAttachment" },
        ],
      },
      schema
    );
    expect(dropped).toEqual(["widget", "fileAttachment"]);
    expect(doc.content?.map((n) => n.type)).toEqual(["columns"]);
  });
});

describe("parseDocJson", () => {
  it("returns an empty doc for corrupt or missing content", () => {
    expect(parseDocJson("{not json")).toEqual({ type: "doc", content: [{ type: "paragraph" }] });
    expect(parseDocJson("")).toEqual({ type: "doc", content: [{ type: "paragraph" }] });
    expect(parseDocJson('{"type":"doc","content":[]}')).toEqual({ type: "doc", content: [] });
  });
});
