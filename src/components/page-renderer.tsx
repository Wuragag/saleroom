import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Node, mergeAttributes } from "@tiptap/core";
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
            style: `display:inline-block;padding:13px 28px;background:${accentColor};color:#ffffff;border-radius:9px;font-weight:700;text-decoration:none;font-size:15px;letter-spacing:-0.01em;`,
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

      const inputStyle = isDark
        ? `width:100%;padding:10px 14px;border:1px solid rgba(255,255,255,0.1);border-radius:8px;font-size:15px;background:rgba(255,255,255,0.06);color:#f0efe9;font-family:inherit;box-sizing:border-box;`
        : `width:100%;padding:10px 14px;border:1px solid rgba(0,0,0,0.1);border-radius:8px;font-size:15px;background:#ffffff;color:#0f172a;font-family:inherit;box-sizing:border-box;`;

      const labelStyle = isDark
        ? `display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:#f0efe9;letter-spacing:0.01em;`
        : `display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:#0f172a;letter-spacing:0.01em;`;

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
                  style: inputStyle,
                },
              ],
        ]
      );

      const btnStyle = `margin-top:8px;padding:12px 28px;background:${accentColor};color:#ffffff;border:none;border-radius:9px;font-weight:700;font-size:15px;cursor:pointer;letter-spacing:-0.01em;transition:filter 0.2s ease,transform 0.18s ease;`;

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

      const cardBg = isDark
        ? "rgba(255,255,255,0.045)"
        : "rgba(255,255,255,0.9)";
      const cardBorder = isDark
        ? "1px solid rgba(255,255,255,0.08)"
        : "1px solid rgba(0,0,0,0.075)";
      const namColor = isDark ? "#f0efe9" : "#0f172a";
      const titleColor = isDark ? "#a8a8b3" : "#64748b";
      const shadow = isDark
        ? "0 2px 16px rgba(0,0,0,0.35)"
        : "0 1px 8px rgba(0,0,0,0.07)";

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
              style: `display:flex;align-items:center;gap:6px;font-size:13px;color:${accentColor};text-decoration:none;margin-top:5px;`,
            },
            `✉  ${safeEmail}`,
          ]);
        }
        if (contact.phone) {
          linkEls.push([
            "a",
            {
              href: `tel:${contact.phone.replace(/\D/g, "")}`,
              style: `display:flex;align-items:center;gap:6px;font-size:13px;color:${accentColor};text-decoration:none;margin-top:5px;`,
            },
            `☎  ${safePhone}`,
          ]);
        }

        return [
          "div",
          {
            style: `display:flex;align-items:flex-start;gap:16px;padding:20px;background:${cardBg};border:${cardBorder};border-radius:16px;box-shadow:${shadow};transition:transform 0.2s ease,box-shadow 0.2s ease;`,
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
          ? `background:color-mix(in srgb, ${accentColor} 10%, transparent);color:${accentColor};`
          : `background:${accentColor};color:#ffffff;`;

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
          { style: `${bgCss}border-radius:12px;padding:14px 20px;margin:8px 0;` }
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

      const cardBg = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
      const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
      const textColor = isDark ? "#e2e8f0" : "#1e293b";
      const mutedColor = isDark ? "#94a3b8" : "#64748b";

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
              style: `width:40px;height:40px;border-radius:50%;background:${accentColor};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;flex-shrink:0;`,
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
            style: `background:${cardBg};border:1px solid ${cardBorder};border-left:4px solid ${accentColor};border-radius:12px;padding:24px;margin:12px 0;`,
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

      const cellBg = isDark ? "rgba(255,255,255,0.04)" : `color-mix(in srgb, ${accentColor} 8%, transparent)`;
      const valueColor = accentColor;
      const labelColor = isDark ? "#94a3b8" : "#64748b";

      const cols = metrics.length || 3;

      const cells = metrics.map(
        (m: { value: string; label: string }) => [
          "div",
          { style: `text-align:center;padding:24px 16px;border-radius:10px;background:${cellBg};` },
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
            style: `display:grid;grid-template-columns:repeat(${cols},1fr);gap:8px;padding:12px 0;`,
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
