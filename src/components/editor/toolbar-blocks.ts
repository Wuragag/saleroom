import type { Editor } from "@tiptap/react";
import {
  ImageIcon,
  MousePointerClick,
  Globe,
  Table,
  LayoutGrid,
  FileText,
  UserRound,
  Megaphone,
  Quote as QuoteIcon,
  BarChart3,
  SeparatorHorizontal,
  type LucideIcon,
} from "lucide-react";
import { detectProvider } from "./extensions/embed-utils";

export interface BlockDef {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  insert: (editor: Editor) => void;
}

export const BLOCKS: BlockDef[] = [
  {
    id: "cta",
    label: "Button",
    description: "Call-to-action link",
    icon: MousePointerClick,
    insert: (editor) => {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "ctaButton",
          attrs: { label: "Click Here", url: "#" },
        })
        .run();
    },
  },
  {
    id: "embed",
    label: "Embed",
    description: "YouTube, Loom, Calendar",
    icon: Globe,
    insert: (editor) => {
      const url = window.prompt(
        "Enter embed URL (YouTube, Loom, Google Calendar, Drive, or PDF):"
      );
      if (url) {
        const info = detectProvider(url);
        editor
          .chain()
          .focus()
          .insertContent({
            type: "embed",
            attrs: { src: info.embedUrl, provider: info.provider },
          })
          .run();
      }
    },
  },
  {
    id: "table",
    label: "Table",
    description: "Data table with rows",
    icon: Table,
    insert: (editor) => {
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },
  {
    id: "image",
    label: "Image",
    description: "Full-width image",
    icon: ImageIcon,
    insert: (editor) => {
      const url = window.prompt("Enter image URL:");
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    },
  },
  {
    id: "logos",
    label: "Customer Logos",
    description: "Logo grid row",
    icon: LayoutGrid,
    insert: (editor) => {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "logoGrid",
          attrs: { logos: [] },
        })
        .run();
    },
  },
  {
    id: "form",
    label: "Form",
    description: "Lead capture form",
    icon: FileText,
    insert: (editor) => {
      const formId = `form_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      editor
        .chain()
        .focus()
        .insertContent({
          type: "formBlock",
          attrs: {
            formId,
            fields: [
              { id: "name", type: "text", label: "Name", required: true, preset: true },
              { id: "email", type: "email", label: "Email", required: true, preset: true },
            ],
            submitLabel: "Submit",
            successMessage: "Thank you!",
          },
        })
        .run();
    },
  },
  {
    id: "contact",
    label: "Contact Card",
    description: "Team member card",
    icon: UserRound,
    insert: (editor) => {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "contactCard",
          attrs: {
            contacts: [
              {
                id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                name: "",
                title: "",
                email: "",
                phone: "",
                photo: "",
              },
            ],
          },
        })
        .run();
    },
  },
  {
    id: "callout",
    label: "Callout",
    description: "Highlight bar",
    icon: Megaphone,
    insert: (editor) => {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "banner",
          attrs: {
            text: "Add your announcement here",
            emoji: "📢",
            bgStyle: "accent",
            link: "",
            linkLabel: "Learn more →",
          },
        })
        .run();
    },
  },
  {
    id: "testimonial",
    label: "Testimonial",
    description: "Quote with attribution",
    icon: QuoteIcon,
    insert: (editor) => {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "testimonial",
          attrs: {
            quote: "Add a testimonial quote here...",
            author: "",
            role: "",
            avatar: "",
          },
        })
        .run();
    },
  },
  {
    id: "metrics",
    label: "Metrics",
    description: "Key stats & numbers",
    icon: BarChart3,
    insert: (editor) => {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "metrics",
          attrs: {
            metrics: [
              { value: "99%", label: "Customer satisfaction" },
              { value: "3x", label: "Faster close rate" },
              { value: "50%", label: "Less follow-up time" },
            ],
          },
        })
        .run();
    },
  },
  {
    id: "spacer",
    label: "Spacer",
    description: "Vertical whitespace",
    icon: SeparatorHorizontal,
    insert: (editor) => {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "spacer",
          attrs: { height: "md" },
        })
        .run();
    },
  },
];
