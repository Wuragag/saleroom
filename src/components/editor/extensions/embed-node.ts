import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { EmbedNodeView } from "./embed-node-view";

export const EmbedNode = Node.create({
  name: "embed",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      provider: { default: "generic" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="embed"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    // Sanitize src — only allow http(s) URLs
    let safeSrc = HTMLAttributes.src || "";
    try {
      const parsed = new URL(safeSrc);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        safeSrc = "";
      }
    } catch {
      safeSrc = "";
    }

    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "embed",
        class: "embed-wrapper",
      }),
      [
        "iframe",
        {
          src: safeSrc,
          frameborder: "0",
          allowfullscreen: "true",
          allow:
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
          style:
            "width:100%;aspect-ratio:16/9;border:0;border-radius:8px;",
        },
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmbedNodeView);
  },
});
