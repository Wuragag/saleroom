import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { SpacerNodeView } from "./spacer-node-view";

export const SpacerNode = Node.create({
  name: "spacer",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      height: { default: "md" }, // "sm" | "md" | "lg" | "xl"
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="spacer"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "spacer",
        "data-height": HTMLAttributes.height,
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SpacerNodeView);
  },
});
