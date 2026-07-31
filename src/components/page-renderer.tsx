import { generateHTML } from "@tiptap/html";
import DOMPurify from "isomorphic-dompurify";
import { buildPubExtensions, PUB_SANITIZE_CONFIG } from "@/lib/pub-nodes";

// ─────────────────────────────────────────────────────────────────────────────
// PageRenderer — Tiptap JSON → HTML → sanitize → .pub-content
//
// The node definitions live in src/lib/pub-nodes.ts (buildPubExtensions) so
// the published page, the preview and the editor's synced-block preview all
// serialize content identically.
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
  const extensions = buildPubExtensions({ isDark, accentColor });

  const rawHtml = generateHTML(
    content as Parameters<typeof generateHTML>[0],
    extensions
  );

  // Sanitise the generated HTML to strip any injected scripts, event handlers,
  // or dangerous URI schemes that may have been stored in content JSON.
  const html = DOMPurify.sanitize(rawHtml, PUB_SANITIZE_CONFIG);

  return (
    <div
      className="pub-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
