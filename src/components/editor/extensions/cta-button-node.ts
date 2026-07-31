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
    // Mirrors the published output (pub-nodes.ts): left-aligned, accent-themed.
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "cta-button",
        style: "margin:0;",
      }),
      [
        "a",
        {
          href: HTMLAttributes.url,
          target: "_blank",
          rel: "noopener noreferrer",
          style:
            "display:inline-block;padding:13px 28px;background:var(--pub-accent, #17171a);color:var(--pub-accent-ink, #ffffff);border-radius:var(--pub-radius-sm, 9px);font-weight:700;text-decoration:none;font-size:15px;letter-spacing:-0.01em;",
        },
        HTMLAttributes.label,
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CTAButtonNodeView);
  },
});
