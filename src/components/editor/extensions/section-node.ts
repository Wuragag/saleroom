import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { SectionNodeView } from "./section-node-view";

/**
 * Full-bleed section: a wrapper that breaks out of the centered content
 * column to a full-width brand band (variant: none | wash | tint | ink),
 * re-constraining its own children to the page width. See the breakout CSS
 * in globals.css (.pub-section / .pub-section-inner).
 */
export const SectionNode = Node.create({
  name: "section",
  group: "block",
  content: "block+",
  isolating: true,
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: "wash",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-variant") ?? "wash",
        renderHTML: (attrs: Record<string, unknown>) => ({ "data-variant": String(attrs.variant ?? "wash") }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'section[data-type="section"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const variant = String(HTMLAttributes["data-variant"] ?? HTMLAttributes.variant ?? "wash");
    return [
      "section",
      mergeAttributes(HTMLAttributes, {
        "data-type": "section",
        "data-variant": variant,
        class: `pub-section pub-section--${variant}`,
      }),
      ["div", { class: "pub-section-inner" }, 0],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SectionNodeView);
  },
});
