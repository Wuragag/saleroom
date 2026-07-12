import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { FeatureGridNodeView } from "./feature-grid-node-view";

export const FeatureGridNode = Node.create({
  name: "featureGrid",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      items: {
        default: [
          { icon: "⚡", title: "Fast to launch", description: "Go live in days, not months." },
          { icon: "🔒", title: "Secure by default", description: "Enterprise-grade from day one." },
          { icon: "📈", title: "Built to scale", description: "Grows with your team." },
        ],
        parseHTML: (el: HTMLElement) => {
          const data = el.getAttribute("data-items");
          return data ? JSON.parse(data) : [];
        },
        renderHTML: (attrs: Record<string, unknown>) => ({
          "data-items": JSON.stringify(attrs.items),
        }),
      },
      cols: {
        default: 3,
        parseHTML: (el: HTMLElement) => Number(el.getAttribute("data-cols")) || 3,
        renderHTML: (attrs: Record<string, unknown>) => ({ "data-cols": String(attrs.cols ?? 3) }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="feature-grid"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "feature-grid",
        "data-items":
          typeof HTMLAttributes["data-items"] === "string"
            ? HTMLAttributes["data-items"]
            : JSON.stringify(HTMLAttributes.items || []),
        "data-cols": String(HTMLAttributes.cols ?? HTMLAttributes["data-cols"] ?? 3),
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FeatureGridNodeView);
  },
});
