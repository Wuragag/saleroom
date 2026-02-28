import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CTAButtonNodeView } from "./cta-button-node-view";

export const CTAButtonNode = Node.create({
  name: "ctaButton",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      label: { default: "Click Here" },
      url: { default: "#" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="cta-button"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "cta-button",
        style: "text-align:center;margin:24px 0;",
      }),
      [
        "a",
        {
          href: HTMLAttributes.url,
          target: "_blank",
          rel: "noopener noreferrer",
          style:
            "display:inline-block;padding:12px 32px;background:#0f172a;color:#fff;border-radius:8px;font-weight:600;text-decoration:none;font-size:16px;",
        },
        HTMLAttributes.label,
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CTAButtonNodeView);
  },
});
