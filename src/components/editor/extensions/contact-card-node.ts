import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ContactCardNodeView } from "./contact-card-node-view";

export interface ContactPerson {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  photo: string;
}

export const ContactCardNode = Node.create({
  name: "contactCard",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      contacts: {
        default: [],
        parseHTML: (element: HTMLElement) => {
          const data = element.getAttribute("data-contacts");
          return data ? JSON.parse(data) : [];
        },
        renderHTML: (attributes: Record<string, unknown>) => ({
          "data-contacts": JSON.stringify(attributes.contacts),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="contact-card"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "contact-card" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ContactCardNodeView);
  },
});
