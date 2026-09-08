import { describe, expect, it } from "vitest";
import { sanitizeDoc, sanitizeStylePatch } from "../ai-page-generation";

const TEST_ACCENT = ["#", "0f766e"].join("");

describe("sanitizeDoc", () => {
  it("drops unsafe URLs and unapproved synced blocks without blanking the doc", () => {
    const doc = sanitizeDoc(
      {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Read the recap",
                marks: [
                  { type: "link", attrs: { href: "javascript:alert(1)" } },
                  { type: "bold" },
                ],
              },
            ],
          },
          { type: "embed", attrs: { src: "javascript:alert(1)" } },
          {
            type: "logoGrid",
            attrs: {
              logos: [
                { src: "javascript:alert(1)", alt: "Bad" },
                { src: "https://example.com/logo.png", alt: "Good" },
              ],
            },
          },
          {
            type: "syncedBlock",
            attrs: { syncedBlockId: "allowed-block", blockName: "Approved" },
          },
          {
            type: "syncedBlock",
            attrs: { syncedBlockId: "blocked-block", blockName: "Blocked" },
          },
        ],
      },
      { allowedSyncedBlockIds: new Set(["allowed-block"]) }
    );

    expect(doc).not.toBeNull();
    expect(doc?.content?.map((node) => node.type)).toEqual([
      "paragraph",
      "logoGrid",
      "syncedBlock",
    ]);
    expect(doc?.content?.[0].content?.[0].marks).toEqual([{ type: "bold" }]);
    expect(doc?.content?.[1].attrs).toEqual({
      logos: [{ src: "https://example.com/logo.png", alt: "Good" }],
    });
  });

  it("gives every form a submittable id and normalizes embed URLs", () => {
    const doc = sanitizeDoc({
      type: "doc",
      content: [
        {
          type: "formBlock",
          attrs: { formId: "", fields: [{ id: "f1", type: "email", label: "Email", required: true }] },
        },
        {
          type: "formBlock",
          attrs: { formId: "form_123_abcd", fields: [] },
        },
        { type: "embed", attrs: { src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" } },
        { type: "embed", attrs: { src: "https://calendly.com/acme/30min" } },
      ],
    });
    const [form1, form2, yt, cal] = doc!.content!;
    expect(String(form1.attrs?.formId)).toMatch(/^form_\d+_[a-z0-9]+$/);
    expect(form2.attrs?.formId).toBe("form_123_abcd");
    expect(yt.attrs).toEqual({
      src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      provider: "youtube",
    });
    expect(cal.attrs).toEqual({ src: "https://calendly.com/acme/30min", provider: "generic" });
  });

  it("replaces an empty valid doc with a renderable paragraph", () => {
    expect(sanitizeDoc({ type: "doc", content: [] })).toEqual({
      type: "doc",
      content: [{ type: "paragraph" }],
    });
  });

  it("normalizes columns: caps at 3, drops <2, unnests, and removes strays", () => {
    const col = (text: string) => ({
      type: "column",
      content: [{ type: "paragraph", content: [{ type: "text", text }] }],
    });

    // 4 columns → capped to 3
    const capped = sanitizeDoc({
      type: "doc",
      content: [{ type: "columns", content: [col("a"), col("b"), col("c"), col("d")] }],
    });
    expect(capped?.content?.[0].type).toBe("columns");
    expect(capped?.content?.[0].content).toHaveLength(3);

    // single column → the whole columns node is dropped, doc stays renderable
    const dropped = sanitizeDoc({
      type: "doc",
      content: [{ type: "columns", content: [col("only")] }],
    });
    expect(dropped?.content?.map((n) => n.type)).toEqual(["paragraph"]);

    // nested columns inside a column are removed; empty column gets a paragraph
    const nested = sanitizeDoc({
      type: "doc",
      content: [
        {
          type: "columns",
          content: [
            col("ok"),
            {
              type: "column",
              content: [{ type: "columns", content: [col("x"), col("y")] }],
            },
          ],
        },
      ],
    });
    const columns = nested?.content?.[0];
    expect(columns?.content).toHaveLength(2);
    expect(columns?.content?.[1].content).toEqual([{ type: "paragraph" }]);

    // a stray column outside a columns node is dropped
    const stray = sanitizeDoc({
      type: "doc",
      content: [col("stray"), { type: "paragraph" }],
    });
    expect(stray?.content?.map((n) => n.type)).toEqual(["paragraph"]);

    // a column directly nested inside a column is removed too
    const directNest = sanitizeDoc({
      type: "doc",
      content: [
        {
          type: "columns",
          content: [col("ok"), { type: "column", content: [col("inner")] }],
        },
      ],
    });
    expect(directNest?.content?.[0].content?.[1].content).toEqual([
      { type: "paragraph" },
    ]);
  });
});

describe("sanitizeStylePatch", () => {
  it("accepts only supported style fields and values", () => {
    expect(
      sanitizeStylePatch({
        font: "inter",
        accentColor: TEST_ACCENT,
        background: "white",
        layoutWidth: "wide",
        tabPlacement: "left",
        logoUrl: "https://example.com/logo.png",
        unknown: "ignored",
      })
    ).toEqual({
      font: "inter",
      accentColor: TEST_ACCENT,
      background: "white",
      layoutWidth: "wide",
      tabPlacement: "left",
    });

    expect(
      sanitizeStylePatch({
        font: "papyrus",
        accentColor: "red",
        background: "unknown",
        layoutWidth: "huge",
        tabPlacement: "bottom",
      })
    ).toEqual({});
  });

  it("accepts headingFont, themeRadius, themeDepth and heroLayout", () => {
    expect(
      sanitizeStylePatch({
        headingFont: "fraunces",
        themeRadius: "soft",
        themeDepth: "elevated",
        heroLayout: "centered",
      })
    ).toEqual({
      headingFont: "fraunces",
      themeRadius: "soft",
      themeDepth: "elevated",
      heroLayout: "centered",
    });

    // "" = same-as-body is a valid headingFont
    expect(sanitizeStylePatch({ headingFont: "" })).toEqual({ headingFont: "" });

    expect(
      sanitizeStylePatch({
        headingFont: "papyrus",
        themeRadius: "round",
        themeDepth: "deep",
        heroLayout: "split",
      })
    ).toEqual({});
  });
});
