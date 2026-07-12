import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { TimelineNodeView } from "./timeline-node-view";

export const TimelineNode = Node.create({
  name: "timeline",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      items: {
        default: [
          { label: "Week 1", title: "Kickoff", description: "Align on goals and success criteria." },
          { label: "Week 2", title: "Onboarding", description: "Import data and configure your workspace." },
          { label: "Week 4", title: "Go live", description: "Launch to your team and start seeing results." },
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
    return [{ tag: 'div[data-type="timeline"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "timeline",
        "data-items":
          typeof HTMLAttributes["data-items"] === "string"
            ? HTMLAttributes["data-items"]
            : JSON.stringify(HTMLAttributes.items || []),
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TimelineNodeView);
  },
});
