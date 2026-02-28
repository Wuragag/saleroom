import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { BannerNodeView } from "./banner-node-view";

export const BannerNode = Node.create({
  name: "banner",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      text:       { default: "Add your announcement here" },
      emoji:      { default: "📢" },
      bgStyle:    { default: "accent" }, // "accent" | "subtle" | "warning"
      link:       { default: "" },
      linkLabel:  { default: "Learn more →" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="banner"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type":       "banner",
        "data-text":       HTMLAttributes.text,
        "data-emoji":      HTMLAttributes.emoji,
        "data-bg-style":   HTMLAttributes.bgStyle,
        "data-link":       HTMLAttributes.link,
        "data-link-label": HTMLAttributes.linkLabel,
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BannerNodeView);
  },
});
