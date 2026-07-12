import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ColumnsNodeView } from "./columns-node-view";

const RATIO_TEMPLATES: Record<string, string> = {
  "50-50": "1fr 1fr",
  "60-40": "3fr 2fr",
  "40-60": "2fr 3fr",
};

/** A single column — holds block content; only valid inside `columns`. */
export const ColumnNode = Node.create({
  name: "column",
  content: "block+",
  isolating: true,

  parseHTML() {
    return [{ tag: 'div[data-type="column"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "column", style: "min-width:0;" }), 0];
  },
});

/** Two side-by-side columns that stack on mobile. */
export const ColumnsNode = Node.create({
  name: "columns",
  group: "block",
  content: "column column",
  isolating: true,
  defining: true,

  addAttributes() {
    return {
      ratio: {
        default: "50-50",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-ratio") ?? "50-50",
        renderHTML: (attrs: Record<string, unknown>) => ({ "data-ratio": String(attrs.ratio ?? "50-50") }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="columns"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const ratio = String(HTMLAttributes["data-ratio"] ?? HTMLAttributes.ratio ?? "50-50");
    const template = RATIO_TEMPLATES[ratio] ?? RATIO_TEMPLATES["50-50"];
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "columns",
        "data-ratio": ratio,
        style: `display:grid;grid-template-columns:${template};gap:28px;margin:1.5rem 0;`,
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ColumnsNodeView);
  },
});
