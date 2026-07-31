import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { LogoGridNodeView } from "./logo-grid-node-view";

export const LogoGridNode = Node.create({
  name: "logoGrid",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      logos: {
        default: [],
        parseHTML: (element) => {
          const data = element.getAttribute("data-logos");
          return data ? JSON.parse(data) : [];
        },
        renderHTML: (attributes) => {
          return { "data-logos": JSON.stringify(attributes.logos) };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="logo-grid"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const logos =
      typeof HTMLAttributes["data-logos"] === "string"
        ? JSON.parse(HTMLAttributes["data-logos"])
        : HTMLAttributes.logos || [];

    // Mirrors the published output (pub-nodes.ts): left-aligned grayscale pills.
    const children = logos.map(
      (logo: { src: string; alt?: string }) => [
        "div",
        {
          style:
            "display:inline-flex;align-items:center;padding:10px 20px;background:var(--pub-surface, #f1f5f9);border-radius:100px;",
        },
        [
          "img",
          {
            src: logo.src,
            alt: logo.alt || "",
            style:
              "height:28px;object-fit:contain;filter:grayscale(1) opacity(0.55);",
          },
        ],
      ]
    );

    return [
      "div",
      mergeAttributes(
        {
          "data-type": "logo-grid",
          style:
            "display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:2rem 0;",
        },
        { "data-logos": JSON.stringify(logos) }
      ),
      ...children,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LogoGridNodeView);
  },
});
