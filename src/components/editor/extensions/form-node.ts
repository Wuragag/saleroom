import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { FormNodeView } from "./form-node-view";

export const FormNode = Node.create({
  name: "formBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      formId: {
        default: "",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-form-id") || "",
        renderHTML: (attributes: Record<string, unknown>) => ({
          "data-form-id": attributes.formId,
        }),
      },
      fields: {
        default: [],
        parseHTML: (element: HTMLElement) => {
          const data = element.getAttribute("data-fields");
          return data ? JSON.parse(data) : [];
        },
        renderHTML: (attributes: Record<string, unknown>) => ({
          "data-fields": JSON.stringify(attributes.fields),
        }),
      },
      submitLabel: {
        default: "Submit",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-submit-label") || "Submit",
        renderHTML: (attributes: Record<string, unknown>) => ({
          "data-submit-label": attributes.submitLabel,
        }),
      },
      successMessage: {
        default: "Thank you!",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-success-message") || "Thank you!",
        renderHTML: (attributes: Record<string, unknown>) => ({
          "data-success-message": attributes.successMessage,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="form-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    // Simple wrapper div with data attributes only.
    // Editor uses ReactNodeViewRenderer for interactive display.
    // page-renderer.tsx has its own full HTML form rendering for published pages.
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "form-block",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FormNodeView);
  },
});
