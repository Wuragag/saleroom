import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { MetricsNodeView } from "./metrics-node-view";

export const MetricsNode = Node.create({
  name: "metrics",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      metrics: {
        default: [
          { value: "99%", label: "Customer satisfaction" },
          { value: "3x", label: "Faster close rate" },
          { value: "50%", label: "Less follow-up time" },
        ],
        parseHTML: (element: HTMLElement) => {
          const data = element.getAttribute("data-metrics");
          return data ? JSON.parse(data) : [];
        },
        renderHTML: (attributes: Record<string, unknown>) => ({
          "data-metrics": JSON.stringify(attributes.metrics),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="metrics"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "metrics",
        "data-metrics":
          typeof HTMLAttributes["data-metrics"] === "string"
            ? HTMLAttributes["data-metrics"]
            : JSON.stringify(HTMLAttributes.metrics || []),
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MetricsNodeView);
  },
});
