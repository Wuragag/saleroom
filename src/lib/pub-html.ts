import { getSchema } from "@tiptap/core";
import type { JSONContent } from "@tiptap/core";
import { DOMSerializer, Node as PMNode, type Schema } from "@tiptap/pm/model";
import { Window } from "happy-dom";
import createDOMPurify from "dompurify";
import {
  buildPubExtensions,
  PUB_SANITIZE_CONFIG,
  type PubExtensionOptions,
} from "./pub-nodes";

/**
 * Server-side Tiptap JSON → sanitized HTML for the buyer-facing surfaces.
 *
 * /p/[slug] and /preview/[id] render every tab through renderPubHtml() and
 * hand the client plain HTML strings (TabbedPageView just swaps them), so the
 * buyer bundle carries no Tiptap schema, no DOM shim and no sanitizer — and
 * the server HTML is the final HTML: nothing is re-rendered on hydration.
 *
 * SERVER ONLY: happy-dom must never reach a client bundle. Import this from
 * server components and route handlers only.
 *
 * Why not @tiptap/html's generateHTML? ProseMirror's DOMSerializer applies an
 * inline `style` through `element.style.cssText`, and happy-dom's
 * CSSStyleDeclaration drops any declaration whose value is a var() for the
 * properties it parses (background, color, border, border-radius, …). Every
 * custom block in pub-nodes.ts themes itself through the --pub-* variables,
 * so the server HTML used to ship without block colors and the page only
 * looked right once hydration re-rendered it — a visible flash on every
 * buyer visit. The document facade below hides the `style` accessor, so the
 * serializer falls back to setAttribute, which keeps declarations verbatim.
 *
 * Sanitizing runs against that same happy-dom window rather than through
 * isomorphic-dompurify: that package pulls in jsdom, whose CJS entry
 * `require()`s an ES module and therefore only loads on Node >= 20.19 /
 * >= 22.12. On an older runtime the require threw at module load and every
 * /p/[slug] request 500'd (published or not), while dev on a newer Node
 * looked fine. One DOM implementation, no jsdom, no Node-version cliff.
 */

const HAPPY_DOM_SETTINGS = {
  disableJavaScriptEvaluation: true,
  disableJavaScriptFileLoading: true,
  disableCSSFileLoading: true,
  disableIframePageLoading: true,
  disableComputedStyleRendering: true,
};

/** Rendered in place of a tab whose content can't be serialized at all. */
export const PUB_RENDER_FALLBACK_HTML =
  '<p class="pub-block-missing">This section couldn&#x27;t be displayed.</p>';

const EMPTY_DOC: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

type JsonNode = { type?: unknown; content?: unknown; marks?: unknown } & Record<
  string,
  unknown
>;

const has = (map: object, key: string) =>
  Object.prototype.hasOwnProperty.call(map, key);

function cleanNode(node: unknown, schema: Schema, dropped: string[]): JsonNode | null {
  if (!node || typeof node !== "object") return null;
  const n = node as JsonNode;
  const type = typeof n.type === "string" ? n.type : "";
  if (!type || !has(schema.nodes, type)) {
    dropped.push(type || "(untyped)");
    return null;
  }
  const out: JsonNode = { ...n };
  if (Array.isArray(n.marks)) {
    out.marks = n.marks.filter(
      (m) =>
        !!m &&
        typeof m === "object" &&
        typeof (m as JsonNode).type === "string" &&
        has(schema.marks, (m as JsonNode).type as string)
    );
  }
  if (Array.isArray(n.content)) {
    out.content = n.content
      .map((c) => cleanNode(c, schema, dropped))
      .filter((c): c is JsonNode => c !== null);
  }
  return out;
}

export interface StripResult {
  doc: JSONContent;
  /** Node types removed because this build's schema doesn't define them. */
  dropped: string[];
}

/**
 * Removes nodes (and marks) the schema doesn't know, so content written by a
 * newer or different build — e.g. a block type that only exists on another
 * branch — degrades to "that block is missing" instead of taking the whole
 * page down with "Unknown node type".
 */
export function stripUnknownNodes(content: unknown, schema: Schema): StripResult {
  const dropped: string[] = [];
  const doc = cleanNode(content, schema, dropped);
  if (!doc || doc.type !== "doc") return { doc: EMPTY_DOC, dropped };
  return { doc: doc as JSONContent, dropped };
}

/** Tab content is stored as a JSON string; corrupt rows render as an empty tab. */
export function parseDocJson(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return EMPTY_DOC;
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : EMPTY_DOC;
  } catch {
    return EMPTY_DOC;
  }
}

/**
 * A `document` for ProseMirror's DOMSerializer whose elements expose no
 * `style` accessor (see the module comment). Only the four factory methods
 * the serializer calls are provided.
 */
function rawStyleDocument(doc: Window["document"]): Document {
  const shadow = <T extends object>(el: T): T => {
    Object.defineProperty(el, "style", { value: undefined, configurable: true });
    return el;
  };
  const facade = {
    createElement: (tag: string) => shadow(doc.createElement(tag)),
    createElementNS: (ns: string | null, tag: string) =>
      shadow(doc.createElementNS(ns, tag)),
    createTextNode: (text: string) => doc.createTextNode(text),
    createDocumentFragment: () => doc.createDocumentFragment(),
  };
  return facade as unknown as Document;
}

export interface RenderPubHtmlResult {
  html: string;
  /** Node types that were removed because this build doesn't know them. */
  dropped: string[];
}

/**
 * Tiptap JSON → sanitized published-page HTML. Never throws: a document that
 * can't be serialized at all yields PUB_RENDER_FALLBACK_HTML, and unknown
 * block types are dropped and reported in `dropped` for the caller to log.
 */
export function renderPubHtml(
  content: unknown,
  opts: PubExtensionOptions = {}
): RenderPubHtmlResult {
  const extensions = buildPubExtensions(opts);
  const schema = getSchema(extensions);
  const { doc, dropped } = stripUnknownNodes(content, schema);

  let html: string;
  const win = new Window({ settings: HAPPY_DOM_SETTINGS });
  try {
    const node = PMNode.fromJSON(schema, doc);
    const wrap = win.document.createElement("div");
    DOMSerializer.fromSchema(schema).serializeFragment(
      node.content,
      { document: rawStyleDocument(win.document) },
      wrap as unknown as HTMLElement
    );
    // Sanitize inside the try: the window has to outlive it (closed below).
    const purify = createDOMPurify(win as unknown as Window & typeof globalThis);
    html = purify.sanitize(wrap.innerHTML, PUB_SANITIZE_CONFIG);
  } catch (err) {
    console.error("[pub-html] failed to render page content:", err);
    html = PUB_RENDER_FALLBACK_HTML;
  } finally {
    win.happyDOM.abort();
    void win.happyDOM.close();
  }

  return { html, dropped };
}
