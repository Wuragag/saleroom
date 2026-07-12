"use client";

import { useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Pencil, Check, Plus, Trash2, ImageIcon } from "lucide-react";

interface GalleryImage {
  src: string;
  alt: string;
}

type Layout = "grid-2" | "grid-3" | "rows";

function columnsFor(layout: Layout): string {
  if (layout === "grid-3") return "repeat(3, 1fr)";
  if (layout === "rows") return "1fr";
  return "repeat(2, 1fr)";
}

export function GalleryNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const [editing, setEditing] = useState(false);
  const [images, setImages] = useState<GalleryImage[]>(node.attrs.images ?? []);
  const [layout, setLayout] = useState<Layout>(node.attrs.layout ?? "grid-2");

  const save = () => {
    updateAttributes({ images: images.filter((im) => im.src.trim()), layout });
    setEditing(false);
  };
  const update = (i: number, field: keyof GalleryImage, value: string) => {
    const next = [...images];
    next[i] = { ...next[i], [field]: value };
    setImages(next);
  };
  const add = () => images.length < 9 && setImages([...images, { src: "", alt: "" }]);
  const remove = (i: number) => setImages(images.filter((_, j) => j !== i));

  const valid = images.filter((im) => im.src.trim());

  return (
    <NodeViewWrapper data-type="gallery" className={selected ? "ring-2 ring-primary rounded-xl" : ""}>
      {editing ? (
        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
          {images.map((img, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input value={img.src} onChange={(e) => update(i, "src", e.target.value)} placeholder="Image URL" className="flex-1" />
              <Input value={img.alt} onChange={(e) => update(i, "alt", e.target.value)} placeholder="Alt text" className="w-32" />
              <button onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3">
            {images.length < 9 && (
              <button onClick={add} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Plus className="h-3 w-3" /> Add image
              </button>
            )}
            <div className="w-44 ml-auto">
              <SegmentedControl
                aria-label="Gallery layout"
                value={layout}
                onChange={(v) => setLayout(v as Layout)}
                options={[{ value: "grid-2", label: "2" }, { value: "grid-3", label: "3" }, { value: "rows", label: "Rows" }]}
              />
            </div>
          </div>
          <Button size="sm" onClick={save} className="w-full">
            <Check className="h-3.5 w-3.5 mr-1.5" /> Done
          </Button>
        </div>
      ) : valid.length === 0 ? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="w-full flex items-center justify-center gap-2 py-10 my-6 rounded-xl border border-dashed border-border text-muted-foreground hover:bg-muted/40 transition-colors text-sm"
        >
          <ImageIcon className="h-4 w-4" /> Add gallery images
        </button>
      ) : (
        <div className="group relative">
          <div
            style={{
              padding: "10px",
              margin: "1.5rem 0",
              borderRadius: "var(--pub-radius-lg, 16px)",
              background: "var(--node-wash, transparent)",
              boxShadow: "0 0 0 1px var(--node-card-border, rgba(0,0,0,0.06)), var(--pub-shadow-md, 0 0 0 0 rgba(0,0,0,0))",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: columnsFor(layout), gap: "8px" }}>
              {valid.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={img.src}
                  alt={img.alt}
                  style={{ width: "100%", aspectRatio: layout === "rows" ? "16/9" : "4/3", objectFit: "cover", borderRadius: "calc(var(--pub-radius-lg, 14px) - 8px)", margin: 0, boxShadow: "none", display: "block" }}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit gallery"
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity bg-muted/80 hover:bg-muted rounded-full"
          >
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      )}
    </NodeViewWrapper>
  );
}
