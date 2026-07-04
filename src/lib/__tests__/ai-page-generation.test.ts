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

  it("replaces an empty valid doc with a renderable paragraph", () => {
    expect(sanitizeDoc({ type: "doc", content: [] })).toEqual({
      type: "doc",
      content: [{ type: "paragraph" }],
    });
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
});
