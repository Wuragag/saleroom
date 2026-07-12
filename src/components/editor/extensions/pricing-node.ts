import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { PricingNodeView } from "./pricing-node-view";

export const PricingNode = Node.create({
  name: "pricing",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      plans: {
        default: [
          { name: "Starter", price: "$29", period: "/mo", features: ["Core features", "Email support"], highlighted: false, ctaLabel: "Get started", ctaUrl: "#" },
          { name: "Growth", price: "$99", period: "/mo", features: ["Everything in Starter", "Priority support", "Advanced analytics"], highlighted: true, ctaLabel: "Choose Growth", ctaUrl: "#" },
        ],
        parseHTML: (el: HTMLElement) => {
          const data = el.getAttribute("data-plans");
          return data ? JSON.parse(data) : [];
        },
        renderHTML: (attrs: Record<string, unknown>) => ({
          "data-plans": JSON.stringify(attrs.plans),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="pricing"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "pricing",
        "data-plans":
          typeof HTMLAttributes["data-plans"] === "string"
            ? HTMLAttributes["data-plans"]
            : JSON.stringify(HTMLAttributes.plans || []),
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PricingNodeView);
  },
});
