import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { FaqNodeView } from "./faq-node-view";

export const FaqNode = Node.create({
  name: "faq",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      items: {
        default: [
          { question: "How does it work?", answer: "Explain the answer here." },
          { question: "What does it cost?", answer: "Explain the answer here." },
        ],
        parseHTML: (el: HTMLElement) => {
          const data = el.getAttribute("data-items");
          return data ? JSON.parse(data) : [];
        },
        renderHTML: (attrs: Record<string, unknown>) => ({
          "data-items": JSON.stringify(attrs.items),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="faq"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "faq",
        "data-items":
          typeof HTMLAttributes["data-items"] === "string"
            ? HTMLAttributes["data-items"]
            : JSON.stringify(HTMLAttributes.items || []),
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FaqNodeView);
  },
});
