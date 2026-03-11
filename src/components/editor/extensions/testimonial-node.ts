import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { TestimonialNodeView } from "./testimonial-node-view";

export const TestimonialNode = Node.create({
  name: "testimonial",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      quote:  { default: "Add a testimonial quote here..." },
      author: { default: "" },
      role:   { default: "" },
      avatar: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="testimonial"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type":   "testimonial",
        "data-quote":  HTMLAttributes.quote,
        "data-author": HTMLAttributes.author,
        "data-role":   HTMLAttributes.role,
        "data-avatar": HTMLAttributes.avatar,
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TestimonialNodeView);
  },
});
