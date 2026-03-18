"use client";

import { useState } from "react";
import Image from "next/image";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, ImageIcon } from "lucide-react";

interface Logo {
  src: string;
  alt?: string;
}

export function LogoGridNodeView({
  node,
  updateAttributes,
  selected,
}: NodeViewProps) {
  const [showInput, setShowInput] = useState(false);
  const [newUrl, setNewUrl] = useState("");

  const logos: Logo[] = node.attrs.logos || [];

  const addLogo = () => {
    if (!newUrl) return;
    updateAttributes({ logos: [...logos, { src: newUrl, alt: "" }] });
    setNewUrl("");
    setShowInput(false);
  };

  const removeLogo = (index: number) => {
    const updated = logos.filter((_, i) => i !== index);
    updateAttributes({ logos: updated });
  };

  return (
    <NodeViewWrapper
      data-type="logo-grid"
      className={selected ? "ring-2 ring-primary rounded-lg" : ""}
    >
      <div className="py-6 my-4 border-2 border-dashed rounded-lg">
        {logos.length === 0 && !showInput ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImageIcon className="h-6 w-6" />
            <span className="text-sm">Customer Logos</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-6">
            {logos.map((logo, i) => (
              <div key={i} className="relative group">
                <Image
                  src={logo.src}
                  alt={logo.alt || ""}
                  width={120}
                  height={40}
                  className="object-contain"
                  style={{ height: "40px", width: "auto" }}
                />
                <button
                  onClick={() => removeLogo(i)}
                  className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center mt-3">
          {showInput ? (
            <div className="flex gap-2 px-4">
              <Input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="Paste logo image URL..."
                className="w-64"
                onKeyDown={(e) => e.key === "Enter" && addLogo()}
              />
              <Button size="sm" onClick={addLogo}>
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowInput(false);
                  setNewUrl("");
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowInput(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Logo
            </Button>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
}
