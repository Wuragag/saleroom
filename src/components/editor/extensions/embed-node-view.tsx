import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { detectProvider } from "./embed-utils";
import { Globe } from "lucide-react";

export function EmbedNodeView({ node, selected }: NodeViewProps) {
  const { src } = node.attrs;
  const info = src ? detectProvider(src) : null;

  if (!src || !info) {
    return (
      <NodeViewWrapper data-type="embed">
        <div className="flex items-center justify-center gap-2 p-8 border-2 border-dashed rounded-lg text-muted-foreground">
          <Globe className="h-5 w-5" />
          <span>No URL provided</span>
        </div>
      </NodeViewWrapper>
    );
  }

  const style: React.CSSProperties = info.aspectRatio
    ? { aspectRatio: info.aspectRatio, width: "100%" }
    : { height: info.height || "400px", width: "100%" };

  return (
    <NodeViewWrapper
      data-type="embed"
      className={selected ? "ring-2 ring-primary rounded-lg" : ""}
    >
      <div className="relative my-4">
        <div className="absolute top-2 left-2 z-10 bg-black/60 text-white text-xs px-2 py-0.5 rounded capitalize">
          {info.provider}
        </div>
        <iframe
          src={info.embedUrl}
          style={style}
          className="rounded-lg border-0"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    </NodeViewWrapper>
  );
}
