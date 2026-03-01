import { ReactRenderer } from "@tiptap/react";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import { SlashCommandList } from "./slash-command-list";
import { detectProvider } from "./embed-utils";
import type { Editor, Range } from "@tiptap/core";

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: string;
  aliases: string[];
  command: (props: { editor: Editor; range: Range }) => void;
}

const COMMANDS: SlashCommandItem[] = [
  {
    title: "Heading 1",
    description: "Large section heading",
    icon: "Heading1",
    aliases: ["h1", "heading"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: "Heading2",
    aliases: ["h2", "heading"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: "Heading3",
    aliases: ["h3", "heading"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
    },
  },
  {
    title: "Text",
    description: "Plain text paragraph",
    icon: "Type",
    aliases: ["paragraph", "text", "p"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    title: "Bullet List",
    description: "Unordered list",
    icon: "List",
    aliases: ["bullet", "list", "ul"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Ordered List",
    description: "Numbered list",
    icon: "ListOrdered",
    aliases: ["numbered", "ordered", "ol"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Embed",
    description: "Loom, YouTube, Calendar, Drive, PDF",
    icon: "Globe",
    aliases: ["embed", "video", "iframe", "loom", "youtube"],
    command: ({ editor, range }) => {
      const url = window.prompt(
        "Enter embed URL (YouTube, Loom, Google Calendar, Drive, or PDF):"
      );
      if (url) {
        const info = detectProvider(url);
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: "embed",
            attrs: { src: info.embedUrl, provider: info.provider },
          })
          .run();
      } else {
        editor.chain().focus().deleteRange(range).run();
      }
    },
  },
  {
    title: "Image",
    description: "Full-width image from URL",
    icon: "ImageIcon",
    aliases: ["image", "img", "picture"],
    command: ({ editor, range }) => {
      const url = window.prompt("Enter image URL:");
      if (url) {
        editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
      } else {
        editor.chain().focus().deleteRange(range).run();
      }
    },
  },
  {
    title: "Divider",
    description: "Horizontal rule separator",
    icon: "Minus",
    aliases: ["divider", "hr", "separator", "line"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: "Table",
    description: "Insert a 3×3 table",
    icon: "Table",
    aliases: ["table", "grid"],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },
  {
    title: "Button",
    description: "Call-to-action button with link",
    icon: "MousePointerClick",
    aliases: ["button", "cta", "action"],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: "ctaButton",
          attrs: { label: "Click Here", url: "#" },
        })
        .run();
    },
  },
  {
    title: "Customer Logos",
    description: "Grid row of logo images",
    icon: "LayoutGrid",
    aliases: ["logos", "customers", "brands"],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: "logoGrid",
          attrs: { logos: [] },
        })
        .run();
    },
  },
  {
    title: "Form",
    description: "Collect leads with a form",
    icon: "FileText",
    aliases: ["form", "contact", "lead", "input"],
    command: ({ editor, range }) => {
      const formId = `form_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      editor
        .chain()
        .focus()
        .deleteRange(range)
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
    title: "Blockquote",
    description: "Quote or callout",
    icon: "Quote",
    aliases: ["quote", "blockquote", "callout"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "Contact Card",
    description: "Team member cards with photo, email & phone",
    icon: "UserRound",
    aliases: ["contact", "card", "team", "people", "rep", "person"],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
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
    title: "Callout",
    description: "Highlight or announcement bar",
    icon: "Megaphone",
    aliases: ["callout", "banner", "announcement", "alert", "notice", "bar", "highlight"],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: "banner",
          attrs: {
            text:      "Add your announcement here",
            emoji:     "📢",
            bgStyle:   "accent",
            link:      "",
            linkLabel: "Learn more →",
          },
        })
        .run();
    },
  },
];

export const slashCommandSuggestion = {
  char: "/",
  allowSpaces: false,
  command: ({
    editor,
    range,
    props,
  }: {
    editor: Editor;
    range: Range;
    props: SlashCommandItem;
  }) => {
    props.command({ editor, range });
  },
  items: ({ query }: { query: string }) => {
    const search = query.toLowerCase();
    return COMMANDS.filter(
      (item) =>
        item.title.toLowerCase().includes(search) ||
        item.aliases.some((alias) => alias.includes(search))
    );
  },
  render: () => {
    let component: ReactRenderer;
    let popup: TippyInstance[];

    return {
      onStart: (props: Record<string, unknown>) => {
        component = new ReactRenderer(SlashCommandList, {
          props,
          editor: props.editor as Editor,
        });

        const clientRect = props.clientRect as () => DOMRect;

        popup = tippy("body", {
          getReferenceClientRect: clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
        });
      },

      onUpdate: (props: Record<string, unknown>) => {
        component.updateProps(props);
        const clientRect = props.clientRect as () => DOMRect;
        if (popup[0]) {
          popup[0].setProps({ getReferenceClientRect: clientRect });
        }
      },

      onKeyDown: (props: { event: KeyboardEvent }) => {
        if (props.event.key === "Escape") {
          popup[0]?.hide();
          return true;
        }
        return (component.ref as { onKeyDown: (props: { event: KeyboardEvent }) => boolean })?.onKeyDown(props);
      },

      onExit: () => {
        popup[0]?.destroy();
        component?.destroy();
      },
    };
  },
};
