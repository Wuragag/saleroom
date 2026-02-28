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

    const children = logos.map(
      (logo: { src: string; alt?: string }) => [
        "img",
        {
          src: logo.src,
          alt: logo.alt || "",
          style: "height:40px;object-fit:contain;",
        },
      ]
    );

    return [
      "div",
      mergeAttributes(
        {
          "data-type": "logo-grid",
          style:
            "display:flex;flex-wrap:wrap;align-items:center;gap:24px;justify-content:center;padding:24px 0;",
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
