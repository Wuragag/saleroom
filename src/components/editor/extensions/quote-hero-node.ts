import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { QuoteHeroNodeView } from "./quote-hero-node-view";

export const QuoteHeroNode = Node.create({
  name: "quoteHero",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      quote: { default: "Add a standout quote that makes the case." },
      author: { default: "" },
      role: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="quote-hero"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "quote-hero",
        "data-quote": String(HTMLAttributes.quote ?? ""),
        "data-author": String(HTMLAttributes.author ?? ""),
        "data-role": String(HTMLAttributes.role ?? ""),
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(QuoteHeroNodeView);
  },
});
