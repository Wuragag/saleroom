import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Node, mergeAttributes } from "@tiptap/core";
import type { DOMOutputSpec } from "@tiptap/pm/model";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import DOMPurify from "isomorphic-dompurify";

// ─────────────────────────────────────────────────────────────────────────────
// URL sanitisation helpers — block javascript:, data:, vbscript:, etc.
// ─────────────────────────────────────────────────────────────────────────────

/** Returns the URL unchanged if it uses http(s), or "" otherwise. */
function sanitizeUrl(raw: unknown): string {
  if (typeof raw !== "string" || !raw) return "";
  try {
    const u = new URL(raw);
    if (u.protocol === "https:" || u.protocol === "http:") return raw;
    return "";
  } catch {
    return "";
  }
}

/** Strips HTML-special characters to prevent attribute-breakout injection. */
function escapeHtml(str: unknown): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// ─────────────────────────────────────────────────────────────────────────────
// Embed node
// ─────────────────────────────────────────────────────────────────────────────

const EmbedNodeServer = Node.create({
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
    const safeSrc = sanitizeUrl(HTMLAttributes.src);
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
          style: "width:100%;aspect-ratio:16/9;border:0;display:block;",
        },
      ],
    ];
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// CTA Button node — left-aligned, Syne font, accent color
// ─────────────────────────────────────────────────────────────────────────────

function createCTAButtonNode(accentColor: string) {
  return Node.create({
    name: "ctaButton",
    group: "block",
    atom: true,
    addAttributes() {
      return {
        label: { default: "Click Here" },
        url: { default: "#" },
      };
    },
    parseHTML() {
      return [{ tag: 'div[data-type="cta-button"]' }];
    },
    renderHTML({ HTMLAttributes }) {
      const safeUrl = sanitizeUrl(HTMLAttributes.url) || "#";
      const safeLabel = escapeHtml(HTMLAttributes.label) || "Click Here";
      return [
        "div",
        mergeAttributes(HTMLAttributes, {
          "data-type": "cta-button",
          style: "margin:0;",
        }),
        [
          "a",
          {
            href: safeUrl,
            target: "_blank",
            rel: "noopener noreferrer",
            style: `display:inline-block;padding:13px 28px;background:var(--pub-accent, ${accentColor});color:var(--pub-accent-ink, #ffffff);border-radius:var(--pub-radius-sm, 9px);font-weight:700;text-decoration:none;font-size:15px;letter-spacing:-0.01em;`,
          },
          safeLabel,
        ],
      ];
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Logo Grid node — pill-style cards with grayscale-to-color on hover
// ─────────────────────────────────────────────────────────────────────────────

function createLogoGridNode(isDark: boolean) {
  return Node.create({
    name: "logoGrid",
    group: "block",
    atom: true,
    addAttributes() {
      return {
        logos: {
          default: [],
          parseHTML: (element: HTMLElement) => {
            const data = element.getAttribute("data-logos");
            return data ? JSON.parse(data) : [];
          },
          renderHTML: (attributes: Record<string, unknown>) => ({
            "data-logos": JSON.stringify(attributes.logos),
          }),
        },
      };
    },
    parseHTML() {
      return [{ tag: 'div[data-type="logo-grid"]' }];
    },
    renderHTML({ HTMLAttributes }) {
      const logos =
        typeof HTMLAttributes["data-logos"] === "string"
          ? JSON.parse(HTMLAttributes["data-logos"])
          : HTMLAttributes.logos || [];

      const pillBg = isDark ? "#13131a" : "#f1f5f9";
      const children = logos.map(
        (logo: { src: string; alt?: string }) => {
          const safeSrc = sanitizeUrl(logo.src);
          if (!safeSrc) return ["div", {}]; // skip logos with unsafe URLs
          return [
            "div",
            {
              style: `display:inline-flex;align-items:center;padding:10px 20px;background:${pillBg};border-radius:100px;`,
            },
            [
              "img",
              {
                src: safeSrc,
                alt: escapeHtml(logo.alt || ""),
                style:
                  "height:28px;object-fit:contain;filter:grayscale(1) opacity(0.55);transition:filter 0.22s ease,transform 0.22s ease;",
              },
            ],
          ];
        }
      );

      return [
        "div",
        mergeAttributes(
          {
            "data-type": "logo-grid",
            style: "display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:2rem 0;",
          },
          { "data-logos": JSON.stringify(logos) }
        ),
        ...children,
      ];
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Form Block node — dark-aware field styles
// ─────────────────────────────────────────────────────────────────────────────

function createFormBlockNode(isDark: boolean, accentColor: string) {
  return Node.create({
    name: "formBlock",
    group: "block",
    atom: true,
    addAttributes() {
      return {
        formId: {
          default: "",
          parseHTML: (el: HTMLElement) => el.getAttribute("data-form-id") || "",
          renderHTML: (attrs: Record<string, unknown>) => ({ "data-form-id": attrs.formId }),
        },
        fields: {
          default: [],
          parseHTML: (el: HTMLElement) => {
            const d = el.getAttribute("data-fields");
            return d ? JSON.parse(d) : [];
          },
          renderHTML: (attrs: Record<string, unknown>) => ({
            "data-fields": JSON.stringify(attrs.fields),
          }),
        },
        submitLabel: {
          default: "Submit",
          parseHTML: (el: HTMLElement) => el.getAttribute("data-submit-label") || "Submit",
          renderHTML: (attrs: Record<string, unknown>) => ({
            "data-submit-label": attrs.submitLabel,
          }),
        },
        successMessage: {
          default: "Thank you!",
          parseHTML: (el: HTMLElement) =>
            el.getAttribute("data-success-message") || "Thank you!",
          renderHTML: (attrs: Record<string, unknown>) => ({
            "data-success-message": attrs.successMessage,
          }),
        },
      };
    },
    parseHTML() {
      return [{ tag: 'div[data-type="form-block"]' }];
    },
    renderHTML({ HTMLAttributes }) {
      const fields =
        typeof HTMLAttributes["data-fields"] === "string"
          ? JSON.parse(HTMLAttributes["data-fields"])
          : HTMLAttributes.fields || [];

      const inputStyle = `width:100%;padding:10px 14px;border:1px solid var(--pub-divider, rgba(0,0,0,0.1));border-radius:var(--pub-radius-sm, 8px);font-size:15px;background:${isDark ? "rgba(255,255,255,0.06)" : "#ffffff"};color:var(--pub-heading-color, #0f172a);font-family:inherit;box-sizing:border-box;`;

      const labelStyle = `display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:var(--pub-heading-color, #0f172a);letter-spacing:0.01em;`;

      const fieldElements = fields.map(
        (field: { id: string; type: string; label: string; required?: boolean }) => [
          "div",
          { style: "margin-bottom:18px;" },
          ["label", { style: labelStyle }, `${field.label}${field.required ? " *" : ""}`],
          field.type === "textarea"
            ? [
                "textarea",
                {
                  name: field.id,
                  placeholder: field.label,
                  "aria-label": field.label,
                  required: field.required || undefined,
                  style: `${inputStyle}min-height:88px;resize:vertical;`,
                },
              ]
            : [
                "input",
                {
                  type: field.type === "phone" ? "tel" : field.type,
                  name: field.id,
                  placeholder: field.label,
                  "aria-label": field.label,
                  required: field.required || undefined,
                  style: inputStyle,
                },
              ],
        ]
      );

      const btnStyle = `margin-top:8px;padding:12px 28px;background:var(--pub-accent, ${accentColor});color:var(--pub-accent-ink, #ffffff);border:none;border-radius:var(--pub-radius-sm, 9px);font-weight:700;font-size:15px;cursor:pointer;letter-spacing:-0.01em;transition:filter 0.2s ease,transform 0.18s ease;`;

      return [
        "div",
        mergeAttributes(
          { "data-type": "form-block", style: "padding:2rem 0;" },
          {
            "data-form-id": HTMLAttributes["data-form-id"] || HTMLAttributes.formId || "",
            "data-fields":
              typeof HTMLAttributes["data-fields"] === "string"
                ? HTMLAttributes["data-fields"]
                : JSON.stringify(fields),
            "data-submit-label":
              HTMLAttributes["data-submit-label"] || HTMLAttributes.submitLabel || "Submit",
            "data-success-message":
              HTMLAttributes["data-success-message"] ||
              HTMLAttributes.successMessage ||
              "Thank you!",
          }
        ),
        [
          "form",
          { style: "max-width:460px;" },
          ...fieldElements,
          [
            "button",
            { type: "submit", style: btnStyle },
            HTMLAttributes["data-submit-label"] || HTMLAttributes.submitLabel || "Submit",
          ],
        ],
      ];
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Contact Card node — dark-aware card backgrounds
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derives an on-brand avatar gradient from the page accent color. The hue is
 * always the accent itself; only the lightness/opacity of the two stops varies
 * subtly by name so distinct contacts read as a cohesive set rather than the
 * old off-brand rainbow.
 */
function cardGradient(
  name: string,
  accentColor: string
): readonly [string, string] {
  const variant = (name.charCodeAt(0) || 0) % 4;
  const topMix = 100 - variant * 8; // 100 / 92 / 84 / 76
  const bottomMix = 78 - variant * 6; // 78 / 72 / 66 / 60
  return [
    `color-mix(in srgb, ${accentColor} ${topMix}%, #ffffff)`,
    `color-mix(in srgb, ${accentColor} ${bottomMix}%, #000000)`,
  ];
}

function cardInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

interface ContactPersonServer {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  photo: string;
}

function createContactCardNode(isDark: boolean, accentColor: string) {
  return Node.create({
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
      const contacts: ContactPersonServer[] =
        typeof HTMLAttributes["data-contacts"] === "string"
          ? JSON.parse(HTMLAttributes["data-contacts"])
          : HTMLAttributes.contacts || [];

      const colStyle =
        contacts.length === 1
          ? "display:grid;grid-template-columns:1fr;gap:16px;padding:1.5rem 0;"
          : "display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;padding:1.5rem 0;";

      const cardBg = isDark ? "var(--pub-card-bg, rgba(255,255,255,0.045))" : "rgba(255,255,255,0.9)";
      const cardBorder = "1px solid var(--pub-divider, rgba(0,0,0,0.075))";
      const namColor = "var(--pub-heading-color, #0f172a)";
      const titleColor = "var(--pub-muted-color, #64748b)";
      const shadow = "var(--pub-shadow-sm, 0 1px 8px rgba(0,0,0,0.07))";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cardEls: any[] = contacts.map((contact) => {
        const [c1, c2] = cardGradient(contact.name || "A", accentColor);
        const initials = cardInitials(contact.name || "?");

        const safePhoto = sanitizeUrl(contact.photo);
        const safeName = escapeHtml(contact.name || "");
        const safeTitle = escapeHtml(contact.title || "");
        const safeEmail = escapeHtml(contact.email || "");
        const safePhone = escapeHtml(contact.phone || "");

        const avatarEl = safePhoto
          ? [
              "img",
              {
                src: safePhoto,
                alt: safeName,
                style:
                  "width:52px;height:52px;border-radius:50%;object-fit:cover;flex-shrink:0;",
              },
            ]
          : [
              "div",
              {
                style: `width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,${c1},${c2});display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:16px;flex-shrink:0;letter-spacing:-0.5px;`,
              },
              initials,
            ];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const linkEls: any[] = [];
        if (contact.email) {
          // Only allow simple email characters to prevent injection
          const emailDigits = contact.email.replace(/[^\w.@+\-]/g, "");
          linkEls.push([
            "a",
            {
              href: `mailto:${emailDigits}`,
              style: `display:flex;align-items:center;gap:6px;font-size:13px;color:var(--pub-accent-safe, ${accentColor});text-decoration:none;margin-top:5px;`,
            },
            `✉  ${safeEmail}`,
          ]);
        }
        if (contact.phone) {
          linkEls.push([
            "a",
            {
              href: `tel:${contact.phone.replace(/\D/g, "")}`,
              style: `display:flex;align-items:center;gap:6px;font-size:13px;color:var(--pub-accent-safe, ${accentColor});text-decoration:none;margin-top:5px;`,
            },
            `☎  ${safePhone}`,
          ]);
        }

        return [
          "div",
          {
            style: `display:flex;align-items:flex-start;gap:16px;padding:20px;background:${cardBg};border:${cardBorder};border-radius:var(--pub-radius-md, 16px);box-shadow:${shadow};transition:transform 0.2s ease,box-shadow 0.2s ease;`,
          },
          avatarEl,
          [
            "div",
            { style: "flex:1;min-width:0;" },
            [
              "p",
              { style: `margin:0 0 3px;font-weight:700;font-size:15px;line-height:1.3;color:${namColor};` },
              safeName,
            ],
            [
              "p",
              { style: `margin:0 0 10px;font-size:11.5px;font-weight:600;color:${titleColor};text-transform:uppercase;letter-spacing:0.06em;` },
              safeTitle,
            ],
            ...linkEls,
          ],
        ];
      });

      return [
        "div",
        mergeAttributes(
          { "data-type": "contact-card", style: colStyle },
          { "data-contacts": JSON.stringify(contacts) }
        ),
        ...cardEls,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any;
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Banner node — announcement / highlight bar
// ─────────────────────────────────────────────────────────────────────────────

function createBannerNode(accentColor: string) {
  return Node.create({
    name: "banner",
    group: "block",
    atom: true,
    addAttributes() {
      return {
        text:      { default: "Add your announcement here" },
        emoji:     { default: "📢" },
        bgStyle:   { default: "accent" },
        link:      { default: "" },
        linkLabel: { default: "Learn more →" },
      };
    },
    parseHTML() {
      return [{ tag: 'div[data-type="banner"]' }];
    },
    renderHTML({ HTMLAttributes }) {
      const bgStyle = HTMLAttributes["data-bg-style"] || HTMLAttributes.bgStyle || "accent";
      const text     = escapeHtml(HTMLAttributes["data-text"]      || HTMLAttributes.text      || "");
      const emoji    = escapeHtml(HTMLAttributes["data-emoji"]     || HTMLAttributes.emoji     || "");
      const link     = sanitizeUrl(HTMLAttributes["data-link"]     || HTMLAttributes.link      || "");
      const linkLabel = escapeHtml(HTMLAttributes["data-link-label"] || HTMLAttributes.linkLabel || "Learn more →");

      const bgCss =
        bgStyle === "warning"
          ? "background:#fef3c7;color:#92400e;"
          : bgStyle === "subtle"
          ? `background:color-mix(in srgb, ${accentColor} 10%, transparent);color:var(--pub-accent-safe, ${accentColor});`
          : `background:var(--pub-accent, ${accentColor});color:var(--pub-accent-ink, #ffffff);`;

      const innerContent = link
        ? [
            "a",
            {
              href: link,
              target: "_blank",
              rel: "noopener noreferrer",
              style: "display:flex;align-items:center;justify-content:space-between;gap:16px;text-decoration:none;color:inherit;",
            },
            ["span", { style: "font-size:14px;font-weight:600;" }, emoji ? `${emoji} ${text}` : text],
            ["span", { style: "font-size:13px;font-weight:700;white-space:nowrap;text-decoration:underline;text-underline-offset:3px;" }, linkLabel],
          ]
        : [
            "div",
            { style: "display:flex;align-items:center;" },
            ["span", { style: "font-size:14px;font-weight:600;" }, emoji ? `${emoji} ${text}` : text],
          ];

      return [
        "div",
        mergeAttributes(
          {
            "data-type":       "banner",
            "data-bg-style":   bgStyle,
            "data-text":       HTMLAttributes["data-text"]        || HTMLAttributes.text       || "",
            "data-emoji":      HTMLAttributes["data-emoji"]       || HTMLAttributes.emoji      || "",
            "data-link":       HTMLAttributes["data-link"]        || HTMLAttributes.link       || "",
            "data-link-label": HTMLAttributes["data-link-label"]  || HTMLAttributes.linkLabel  || "Learn more →",
          },
          { style: `${bgCss}border-radius:var(--pub-radius-md, 12px);padding:14px 20px;margin:8px 0;` }
        ),
        innerContent,
      ];
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Testimonial node — styled quote card with accent border
// ─────────────────────────────────────────────────────────────────────────────

function createTestimonialNode(isDark: boolean, accentColor: string) {
  return Node.create({
    name: "testimonial",
    group: "block",
    atom: true,
    addAttributes() {
      return {
        quote:  { default: "" },
        author: { default: "" },
        role:   { default: "" },
        avatar: { default: "" },
      };
    },
    parseHTML() {
      return [{ tag: 'div[data-type="testimonial"]' }];
    },
    renderHTML({ HTMLAttributes }) {
      const safeQuote  = escapeHtml(HTMLAttributes["data-quote"]  || HTMLAttributes.quote  || "");
      const safeAuthor = escapeHtml(HTMLAttributes["data-author"] || HTMLAttributes.author || "");
      const safeRole   = escapeHtml(HTMLAttributes["data-role"]   || HTMLAttributes.role   || "");
      const safeAvatar = sanitizeUrl(HTMLAttributes["data-avatar"] || HTMLAttributes.avatar || "");

      const cardBg = isDark ? "var(--pub-card-bg, rgba(255,255,255,0.04))" : "#ffffff";
      const cardBorder = "var(--pub-divider, rgba(0,0,0,0.06))";
      const textColor = "var(--pub-heading-color, #1e293b)";
      const mutedColor = "var(--pub-muted-color, #64748b)";

      const initials = safeAuthor
        .split(" ")
        .map((n: string) => n[0] || "")
        .slice(0, 2)
        .join("")
        .toUpperCase() || "?";

      const avatarEl = safeAvatar
        ? [
            "img",
            {
              src: safeAvatar,
              alt: safeAuthor,
              style: "width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0;",
            },
          ]
        : [
            "div",
            {
              style: `width:40px;height:40px;border-radius:50%;background:var(--pub-accent, ${accentColor});display:flex;align-items:center;justify-content:center;color:var(--pub-accent-ink, #fff);font-weight:700;font-size:14px;flex-shrink:0;`,
            },
            initials,
          ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const children: any[] = [
        ["div", { style: "font-size:32px;line-height:1;opacity:0.15;margin-bottom:12px;" }, "\u201C"],
        ["p", { style: `font-size:16px;line-height:1.7;color:${textColor};margin:0 0 16px;font-style:italic;` }, `\u201C${safeQuote}\u201D`],
      ];

      if (safeAuthor) {
        children.push([
          "div",
          { style: "display:flex;align-items:center;gap:12px;" },
          avatarEl,
          [
            "div",
            {},
            ["p", { style: `margin:0;font-weight:700;font-size:14px;color:${textColor};` }, safeAuthor],
            ...(safeRole ? [["p", { style: `margin:2px 0 0;font-size:12px;color:${mutedColor};` }, safeRole]] : []),
          ],
        ]);
      }

      return [
        "div",
        mergeAttributes(
          {
            "data-type":   "testimonial",
            "data-quote":  HTMLAttributes["data-quote"]  || HTMLAttributes.quote  || "",
            "data-author": HTMLAttributes["data-author"] || HTMLAttributes.author || "",
            "data-role":   HTMLAttributes["data-role"]   || HTMLAttributes.role   || "",
            "data-avatar": HTMLAttributes["data-avatar"] || HTMLAttributes.avatar || "",
          },
          {
            style: `background:${cardBg};border:1px solid ${cardBorder};border-left:4px solid var(--pub-accent, ${accentColor});border-radius:var(--pub-radius-md, 12px);padding:24px;margin:12px 0;box-shadow:var(--pub-shadow-sm, 0 0 0 0 rgba(0,0,0,0));`,
          }
        ),
        ...children,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any;
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Metrics node — row of stat cards
// ─────────────────────────────────────────────────────────────────────────────

function createMetricsNode(isDark: boolean, accentColor: string) {
  return Node.create({
    name: "metrics",
    group: "block",
    atom: true,
    addAttributes() {
      return {
        metrics: {
          default: [],
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
      const metrics =
        typeof HTMLAttributes["data-metrics"] === "string"
          ? JSON.parse(HTMLAttributes["data-metrics"])
          : HTMLAttributes.metrics || [];

      // Single source: emitted by getPubCssVars/getEditorNodeVars (pub-theme.ts)
      const cellBg = "var(--metric-cell-bg, rgba(255,255,255,0.85))";
      const valueColor = `var(--pub-accent-safe, ${accentColor})`;
      const labelColor = "var(--pub-muted-color, #64748b)";

      const cols = metrics.length || 3;

      const cells = metrics.map(
        (m: { value: string; label: string }) => [
          "div",
          { style: `text-align:center;padding:24px 16px;border-radius:var(--pub-radius-md, 10px);background:${cellBg};box-shadow:var(--pub-shadow-sm, 0 0 0 0 rgba(0,0,0,0));` },
          ["div", { style: `font-size:28px;font-weight:800;letter-spacing:-0.02em;color:${valueColor};margin-bottom:6px;` }, escapeHtml(m.value)],
          ["div", { style: `font-size:13px;font-weight:500;color:${labelColor};` }, escapeHtml(m.label)],
        ]
      );

      return [
        "div",
        mergeAttributes(
          { "data-type": "metrics" },
          {
            "data-metrics": JSON.stringify(metrics),
            style: `display:grid;grid-template-columns:repeat(${cols},1fr);gap:10px;padding:14px;margin:12px 0;border-radius:var(--pub-radius-lg, 16px);background:var(--pub-wash, transparent);`,
          }
        ),
        ...cells,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any;
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Spacer node — vertical whitespace
// ─────────────────────────────────────────────────────────────────────────────

const SPACER_HEIGHTS: Record<string, number> = {
  sm: 24,
  md: 48,
  lg: 80,
  xl: 120,
};

const SpacerNodeServer = Node.create({
  name: "spacer",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      height: { default: "md" },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="spacer"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    const h = HTMLAttributes["data-height"] || HTMLAttributes.height || "md";
    const px = SPACER_HEIGHTS[h] ?? 48;
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "spacer",
        "data-height": h,
        style: `height:${px}px;`,
      }),
    ];
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Synced Block fallback — content is normally resolved before generateHTML,
// but this handles any unresolved references gracefully.
// ─────────────────────────────────────────────────────────────────────────────

const SyncedBlockServerFallback = Node.create({
  name: "syncedBlock",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      syncedBlockId: { default: null },
      blockName: { default: "" },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="synced-block"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "synced-block",
        "data-synced-block-id": HTMLAttributes.syncedBlockId || "",
        style:
          "padding:12px 16px;border:1px dashed #cbd5e1;border-radius:8px;color:#94a3b8;font-size:13px;",
      }),
      `[Synced: ${escapeHtml(HTMLAttributes.blockName) || "Unknown block"}]`,
    ];
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Quote hero — oversized editorial pull-quote
// ─────────────────────────────────────────────────────────────────────────────

function createQuoteHeroNode() {
  return Node.create({
    name: "quoteHero",
    group: "block",
    atom: true,
    addAttributes() {
      return { quote: { default: "" }, author: { default: "" }, role: { default: "" } };
    },
    parseHTML() {
      return [{ tag: 'div[data-type="quote-hero"]' }];
    },
    renderHTML({ HTMLAttributes }) {
      const quote = escapeHtml(HTMLAttributes["data-quote"] || HTMLAttributes.quote || "");
      const author = escapeHtml(HTMLAttributes["data-author"] || HTMLAttributes.author || "");
      const role = escapeHtml(HTMLAttributes["data-role"] || HTMLAttributes.role || "");
      const children: unknown[] = [
        ["div", { "aria-hidden": "true", style: "font-family:var(--pub-font-heading,var(--pub-font-body,serif));font-size:64px;line-height:0.8;color:var(--pub-accent-safe,#64748b);opacity:0.25;margin-bottom:4px;" }, "“"],
        ["div", { style: "font-family:var(--pub-font-heading,var(--pub-font-body,inherit));font-size:clamp(1.5rem,3.6vw,2.25rem);font-weight:600;letter-spacing:-0.02em;line-height:1.25;color:var(--pub-heading-color,#17171a);" }, quote],
      ];
      if (author || role) {
        children.push(["div", { style: "margin-top:16px;font-size:14px;font-weight:600;color:var(--pub-muted-color,#64748b);" }, `— ${author}${role ? ` · ${role}` : ""}`]);
      }
      return ["div", mergeAttributes({ "data-type": "quote-hero" }, { style: "margin:3rem 0;" }), ...children] as unknown as DOMOutputSpec;
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature grid — wash-framed cards
// ─────────────────────────────────────────────────────────────────────────────

function createFeatureGridNode() {
  return Node.create({
    name: "featureGrid",
    group: "block",
    atom: true,
    addAttributes() {
      return { items: { default: [] }, cols: { default: 3 } };
    },
    parseHTML() {
      return [{ tag: 'div[data-type="feature-grid"]' }];
    },
    renderHTML({ HTMLAttributes }) {
      const items = typeof HTMLAttributes["data-items"] === "string" ? JSON.parse(HTMLAttributes["data-items"]) : HTMLAttributes.items || [];
      const cols = Number(HTMLAttributes["data-cols"] || HTMLAttributes.cols || 3);
      const cards = items.map((it: { icon?: string; title?: string; description?: string }) => [
        "div",
        { style: "padding:22px 18px;border-radius:var(--pub-radius-md,12px);background:var(--metric-cell-bg,#ffffff);box-shadow:var(--pub-shadow-sm,0 0 0 0 rgba(0,0,0,0));" },
        ["div", { style: "font-size:24px;margin-bottom:10px;line-height:1;" }, escapeHtml(it.icon || "")],
        ["div", { style: "font-size:15px;font-weight:700;color:var(--pub-heading-color,#17171a);margin-bottom:5px;" }, escapeHtml(it.title || "")],
        ["div", { style: "font-size:13.5px;line-height:1.55;color:var(--pub-body-color,#64748b);" }, escapeHtml(it.description || "")],
      ]);
      return [
        "div",
        mergeAttributes({ "data-type": "feature-grid" }, { style: `display:grid;grid-template-columns:repeat(${cols},1fr);gap:14px;padding:14px;margin:1.5rem 0;border-radius:var(--pub-radius-lg,16px);background:var(--pub-wash,transparent);` }),
        ...cards,
      ] as unknown as DOMOutputSpec;
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// FAQ — native <details>/<summary> accordion (zero JS)
// ─────────────────────────────────────────────────────────────────────────────

function createFaqNode() {
  return Node.create({
    name: "faq",
    group: "block",
    atom: true,
    addAttributes() {
      return { items: { default: [] } };
    },
    parseHTML() {
      return [{ tag: 'div[data-type="faq"]' }];
    },
    renderHTML({ HTMLAttributes }) {
      const items = typeof HTMLAttributes["data-items"] === "string" ? JSON.parse(HTMLAttributes["data-items"]) : HTMLAttributes.items || [];
      const rows = items.map((it: { question?: string; answer?: string }) => [
        "details",
        { style: "border-bottom:1px solid var(--pub-divider,rgba(0,0,0,0.08));" },
        ["summary", { style: "cursor:pointer;padding:1rem 2rem 1rem 0;font-weight:600;color:var(--pub-heading-color,#17171a);list-style:none;position:relative;" }, escapeHtml(it.question || "")],
        ["div", { style: "padding:0 2rem 1.125rem 0;color:var(--pub-body-color,#64748b);line-height:1.75;" }, escapeHtml(it.answer || "")],
      ]);
      return ["div", mergeAttributes({ "data-type": "faq" }, { style: "margin:1.75rem 0;" }), ...rows] as unknown as DOMOutputSpec;
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Timeline — vertical steps with accent dots
// ─────────────────────────────────────────────────────────────────────────────

function createTimelineNode() {
  return Node.create({
    name: "timeline",
    group: "block",
    atom: true,
    addAttributes() {
      return { items: { default: [] } };
    },
    parseHTML() {
      return [{ tag: 'div[data-type="timeline"]' }];
    },
    renderHTML({ HTMLAttributes }) {
      const items = typeof HTMLAttributes["data-items"] === "string" ? JSON.parse(HTMLAttributes["data-items"]) : HTMLAttributes.items || [];
      const rows = items.map((it: { label?: string; title?: string; description?: string }, i: number) => {
        const last = i === items.length - 1;
        const marker: unknown[] = [
          "div",
          { style: "position:relative;display:flex;justify-content:center;" },
          ["span", { style: "width:11px;height:11px;border-radius:50%;margin-top:5px;background:var(--pub-accent-safe,#64748b);box-shadow:0 0 0 4px var(--pub-wash,transparent);position:relative;z-index:1;" }],
        ];
        if (!last) (marker as unknown[]).push(["span", { style: "position:absolute;top:16px;bottom:-6px;width:2px;background:var(--pub-divider,rgba(0,0,0,0.1));" }]);
        const body: unknown[] = ["div", { style: `padding-bottom:${last ? "0" : "22px"};` }];
        if (it.label) (body as unknown[]).push(["div", { style: "font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--pub-accent-safe,#64748b);margin-bottom:3px;" }, escapeHtml(it.label)]);
        (body as unknown[]).push(["div", { style: "font-size:16px;font-weight:600;color:var(--pub-heading-color,#17171a);margin-bottom:3px;" }, escapeHtml(it.title || "")]);
        (body as unknown[]).push(["div", { style: "font-size:14px;line-height:1.6;color:var(--pub-body-color,#64748b);" }, escapeHtml(it.description || "")]);
        return ["div", { style: "display:grid;grid-template-columns:16px 1fr;gap:0 18px;" }, marker, body];
      });
      return ["div", mergeAttributes({ "data-type": "timeline" }, { style: "margin:1.75rem 0;" }), ...rows] as unknown as DOMOutputSpec;
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Pricing — plan cards with a highlighted tier
// ─────────────────────────────────────────────────────────────────────────────

function createPricingNode() {
  return Node.create({
    name: "pricing",
    group: "block",
    atom: true,
    addAttributes() {
      return { plans: { default: [] } };
    },
    parseHTML() {
      return [{ tag: 'div[data-type="pricing"]' }];
    },
    renderHTML({ HTMLAttributes }) {
      const plans = typeof HTMLAttributes["data-plans"] === "string" ? JSON.parse(HTMLAttributes["data-plans"]) : HTMLAttributes.plans || [];
      const cards = plans.map((p: { name?: string; price?: string; period?: string; features?: string[]; highlighted?: boolean; ctaLabel?: string; ctaUrl?: string }) => {
        const children: unknown[] = [];
        if (p.highlighted) children.push(["span", { style: "position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:var(--pub-accent,#64748b);color:var(--pub-accent-ink,#fff);font-size:11px;font-weight:700;padding:3px 12px;border-radius:9999px;text-transform:uppercase;letter-spacing:0.05em;" }, "Recommended"]);
        children.push(["div", { style: "font-size:15px;font-weight:700;color:var(--pub-heading-color,#17171a);margin-bottom:8px;" }, escapeHtml(p.name || "")]);
        children.push(["div", { style: "margin-bottom:16px;" },
          ["span", { style: "font-size:34px;font-weight:800;letter-spacing:-0.02em;color:var(--pub-heading-color,#17171a);" }, escapeHtml(p.price || "")],
          ["span", { style: "font-size:14px;color:var(--pub-muted-color,#64748b);" }, escapeHtml(p.period || "")],
        ]);
        const feats = (p.features || []).filter(Boolean).map((f: string) => ["div", { style: "display:flex;gap:8px;font-size:14px;color:var(--pub-body-color,#64748b);" }, ["span", { style: "color:var(--pub-accent-safe,#64748b);font-weight:700;" }, "✓"], escapeHtml(f)]);
        children.push(["div", { style: "display:flex;flex-direction:column;gap:8px;margin-bottom:20px;" }, ...feats]);
        if (p.ctaLabel) {
          const ctaUrl = sanitizeUrl(p.ctaUrl) || "#";
          const ctaStyle = p.highlighted
            ? "display:block;text-align:center;padding:11px;border-radius:var(--pub-radius-sm,8px);font-weight:700;font-size:14px;text-decoration:none;background:var(--pub-accent,#64748b);color:var(--pub-accent-ink,#fff);"
            : "display:block;text-align:center;padding:11px;border-radius:var(--pub-radius-sm,8px);font-weight:700;font-size:14px;text-decoration:none;background:transparent;border:1px solid var(--pub-accent-safe,#64748b);color:var(--pub-accent-safe,#64748b);";
          children.push(["a", { href: ctaUrl, target: "_blank", rel: "noopener noreferrer", style: ctaStyle }, escapeHtml(p.ctaLabel)]);
        }
        const border = p.highlighted ? "2px solid var(--pub-accent,#64748b)" : "1px solid var(--pub-divider,rgba(0,0,0,0.08))";
        const shadow = p.highlighted ? "var(--pub-shadow-md,0 0 0 0 rgba(0,0,0,0))" : "var(--pub-shadow-sm,0 0 0 0 rgba(0,0,0,0))";
        return ["div", { style: `position:relative;background:var(--pub-card-bg,#ffffff);border:${border};border-radius:var(--pub-radius-md,12px);box-shadow:${shadow};padding:26px 22px;` }, ...children];
      });
      const cols = Math.min(plans.length || 1, 3);
      return ["div", mergeAttributes({ "data-type": "pricing" }, { style: `display:grid;grid-template-columns:repeat(${cols},1fr);gap:14px;margin:1.5rem 0;` }), ...cards] as unknown as DOMOutputSpec;
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Gallery — wash-framed image grid
// ─────────────────────────────────────────────────────────────────────────────

function createGalleryNode() {
  return Node.create({
    name: "gallery",
    group: "block",
    atom: true,
    addAttributes() {
      return { images: { default: [] }, layout: { default: "grid-2" } };
    },
    parseHTML() {
      return [{ tag: 'div[data-type="gallery"]' }];
    },
    renderHTML({ HTMLAttributes }) {
      const images = typeof HTMLAttributes["data-images"] === "string" ? JSON.parse(HTMLAttributes["data-images"]) : HTMLAttributes.images || [];
      const layout = String(HTMLAttributes["data-layout"] || HTMLAttributes.layout || "grid-2");
      const cols = layout === "grid-3" ? "repeat(3,1fr)" : layout === "rows" ? "1fr" : "repeat(2,1fr)";
      const ratio = layout === "rows" ? "16/9" : "4/3";
      const imgs = images
        .map((im: { src?: string; alt?: string }) => ({ src: sanitizeUrl(im.src), alt: escapeHtml(im.alt || "") }))
        .filter((im: { src: string }) => im.src && im.src !== "#")
        .map((im: { src: string; alt: string }) => ["img", { src: im.src, alt: im.alt, style: `width:100%;aspect-ratio:${ratio};object-fit:cover;border-radius:calc(var(--pub-radius-lg,14px) - 8px);margin:0;box-shadow:none;display:block;` }]);
      if (imgs.length === 0) return ["div", { "data-type": "gallery", style: "display:none;" }] as unknown as DOMOutputSpec;
      return [
        "div",
        mergeAttributes({ "data-type": "gallery" }, { style: "padding:10px;margin:1.5rem 0;border-radius:var(--pub-radius-lg,16px);background:var(--pub-wash,transparent);box-shadow:0 0 0 1px var(--pub-divider,rgba(0,0,0,0.06)), var(--pub-shadow-md,0 0 0 0 rgba(0,0,0,0));" }),
        ["div", { style: `display:grid;grid-template-columns:${cols};gap:8px;` }, ...imgs],
      ] as unknown as DOMOutputSpec;
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout: full-bleed section + two columns (content-hole nodes)
// ─────────────────────────────────────────────────────────────────────────────

const RATIO_TEMPLATES: Record<string, string> = {
  "50-50": "1fr 1fr",
  "60-40": "3fr 2fr",
  "40-60": "2fr 3fr",
};

const SectionNodeServer = Node.create({
  name: "section",
  group: "block",
  content: "block+",
  isolating: true,
  defining: true,
  addAttributes() {
    return { variant: { default: "wash" } };
  },
  parseHTML() {
    return [{ tag: 'section[data-type="section"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    const variant = String(HTMLAttributes["data-variant"] ?? HTMLAttributes.variant ?? "wash");
    return [
      "section",
      mergeAttributes({ "data-type": "section", "data-variant": variant, class: `pub-section pub-section--${variant}` }),
      ["div", { class: "pub-section-inner" }, 0],
    ];
  },
});

const ColumnNodeServer = Node.create({
  name: "column",
  content: "block+",
  isolating: true,
  parseHTML() {
    return [{ tag: 'div[data-type="column"]' }];
  },
  renderHTML() {
    return ["div", { "data-type": "column", style: "min-width:0;" }, 0];
  },
});

const ColumnsNodeServer = Node.create({
  name: "columns",
  group: "block",
  content: "column column",
  isolating: true,
  defining: true,
  addAttributes() {
    return { ratio: { default: "50-50" } };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="columns"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    const ratio = String(HTMLAttributes["data-ratio"] ?? HTMLAttributes.ratio ?? "50-50");
    const template = RATIO_TEMPLATES[ratio] ?? RATIO_TEMPLATES["50-50"];
    return [
      "div",
      mergeAttributes({ "data-type": "columns", "data-ratio": ratio, class: "pub-columns-grid", style: `display:grid;grid-template-columns:${template};gap:28px;margin:1.5rem 0;` }),
      0,
    ];
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PageRenderer
// ─────────────────────────────────────────────────────────────────────────────

interface PageRendererProps {
  content: Record<string, unknown>;
  isDark?: boolean;
  accentColor?: string;
}

export function PageRenderer({
  content,
  isDark = false,
  accentColor = "#64748b",
}: PageRendererProps) {
  const extensions = [
    StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
    Image,
    Table,
    TableRow,
    TableCell,
    TableHeader,
    TextStyle,
    Color,
    EmbedNodeServer,
    createCTAButtonNode(accentColor),
    createLogoGridNode(isDark),
    createFormBlockNode(isDark, accentColor),
    createContactCardNode(isDark, accentColor),
    createBannerNode(accentColor),
    createTestimonialNode(isDark, accentColor),
    createMetricsNode(isDark, accentColor),
    SpacerNodeServer,
    SyncedBlockServerFallback,
    createQuoteHeroNode(),
    createFeatureGridNode(),
    createFaqNode(),
    createTimelineNode(),
    createPricingNode(),
    createGalleryNode(),
    SectionNodeServer,
    ColumnsNodeServer,
    ColumnNodeServer,
  ];

  const rawHtml = generateHTML(
    content as Parameters<typeof generateHTML>[0],
    extensions
  );

  // Sanitise the generated HTML to strip any injected scripts, event handlers,
  // or dangerous URI schemes that may have been stored in content JSON.
  const html = DOMPurify.sanitize(rawHtml, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: [
      "allow",
      "allowfullscreen",
      "frameborder",
      "target",
      "data-type",
      "data-logos",
      "data-contacts",
      "data-form-id",
      "data-fields",
      "data-submit-label",
      "data-success-message",
      "data-text",
      "data-emoji",
      "data-bg-style",
      "data-link",
      "data-link-label",
      "data-synced-block-id",
      "data-block-name",
      "data-quote",
      "data-author",
      "data-role",
      "data-avatar",
      "data-metrics",
      "data-height",
      "data-items",
      "data-cols",
      "data-plans",
      "data-images",
      "data-layout",
      "data-variant",
      "data-ratio",
      "open",
    ],
    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });

  return (
    <div
      className="pub-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
