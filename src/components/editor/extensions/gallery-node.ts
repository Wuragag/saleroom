import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { GalleryNodeView } from "./gallery-node-view";

export const GalleryNode = Node.create({
  name: "gallery",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      images: {
        default: [],
        parseHTML: (el: HTMLElement) => {
          const data = el.getAttribute("data-images");
          return data ? JSON.parse(data) : [];
        },
        renderHTML: (attrs: Record<string, unknown>) => ({
          "data-images": JSON.stringify(attrs.images),
        }),
      },
      layout: {
        default: "grid-2",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-layout") ?? "grid-2",
        renderHTML: (attrs: Record<string, unknown>) => ({ "data-layout": String(attrs.layout ?? "grid-2") }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="gallery"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "gallery",
        "data-images":
          typeof HTMLAttributes["data-images"] === "string"
            ? HTMLAttributes["data-images"]
            : JSON.stringify(HTMLAttributes.images || []),
        "data-layout": String(HTMLAttributes.layout ?? HTMLAttributes["data-layout"] ?? "grid-2"),
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GalleryNodeView);
  },
});
