import { describe, expect, it } from "vitest";
import {
  collectDocText,
  findPagePlaceholders,
  findPlaceholdersInText,
} from "../page-placeholders";

describe("findPlaceholdersInText", () => {
  it("matches AI and template placeholders", () => {
    expect(findPlaceholdersInText("Cost: [PLACEHOLDER: annual license cost]")).toEqual([
      "[PLACEHOLDER: annual license cost]",
    ]);
    expect(findPlaceholdersInText("Prepared by [Your Name] · [Your Title] · [Date]")).toEqual([
      "[Your Name]",
      "[Your Title]",
      "[Date]",
    ]);
    expect(findPlaceholdersInText("Mail [your@email.com] today")).toEqual(["[your@email.com]"]);
  });

  it("ignores citations and lowercase asides", () => {
    expect(findPlaceholdersInText("See the study [1] and [2].")).toEqual([]);
    expect(findPlaceholdersInText("(pricing [as discussed] applies)")).toEqual([]);
    expect(findPlaceholdersInText("array[0] = x")).toEqual([]);
  });
});

describe("collectDocText", () => {
  it("gathers text nodes and text-bearing block attributes, skipping URLs and ids", () => {
    const text = collectDocText({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Hello [Company Name]" }] },
        { type: "ctaButton", attrs: { label: "[Book the call]", url: "https://x.test/[Not Text]" } },
        {
          type: "contactCard",
          attrs: { contacts: [{ id: "[Id]", name: "[Your Name]", email: "[your@email.com]", photo: "[P]" }] },
        },
        { type: "metrics", attrs: { metrics: [{ value: "[X]%", label: "Uptime" }] } },
      ],
    });
    expect(text).toContain("Hello [Company Name]");
    expect(text).toContain("[Book the call]");
    expect(text).toContain("[Your Name]");
    expect(text).toContain("[your@email.com]");
    expect(text).toContain("[X]%");
    expect(text).not.toContain("[Not Text]");
    expect(text).not.toContain("[Id]");
    expect(text).not.toContain("[P]");
  });
});

describe("findPagePlaceholders", () => {
  it("counts every occurrence and keeps three distinct samples", () => {
    const scan = findPagePlaceholders({
      title: "Proposal for [Company Name]",
      eyebrow: "",
      subtitle: "[PLACEHOLDER: one-line promise]",
      tabs: [
        {
          content: {
            type: "doc",
            content: [
              { type: "paragraph", content: [{ type: "text", text: "[Company Name] and [Date] and [Company Name]" }] },
            ],
          },
        },
        { content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "[Your Name]" }] }] } },
      ],
    });
    expect(scan.count).toBe(6);
    expect(scan.samples).toEqual(["[Company Name]", "[PLACEHOLDER: one-line promise]", "[Date]"]);
  });

  it("reports a clean page", () => {
    expect(
      findPagePlaceholders({ title: "Acme renewal", tabs: [{ content: { type: "doc", content: [] } }] })
    ).toEqual({ count: 0, samples: [] });
  });
});
