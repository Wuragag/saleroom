"use client";

import { useRef, useState } from "react";
import { ImageIcon, Upload, X } from "lucide-react";

interface CoverImageEditorProps {
  pageId: string;
  coverImage: string;
  onCoverImageChange: (url: string) => void;
}

export function CoverImageEditor({
  pageId,
  coverImage,
  onCoverImageChange,
}: CoverImageEditorProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await fetch(`/api/pages/${pageId}/cover`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) return;

      const { url } = await uploadRes.json();

      // Persist to the page
      await fetch(`/api/pages/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverImage: url }),
      });

      onCoverImageChange(url);
    } finally {
      setUploading(false);
      // Reset file input so the same file can be re-selected
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    await fetch(`/api/pages/${pageId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverImage: "" }),
    });
    onCoverImageChange("");
  };

  /* ── Hidden file input ── */
  const fileInput = (
    <input
      ref={fileRef}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
      }}
    />
  );

  /* ── Empty state ── */
  if (!coverImage) {
    return (
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="group flex items-center gap-2 mb-3 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors text-xs font-medium"
      >
        <ImageIcon className="h-3.5 w-3.5" />
        {uploading ? "Uploading…" : "Add cover image"}
        {fileInput}
      </button>
    );
  }

  /* ── Cover image set ── */
  return (
    <div className="group relative w-full rounded-xl overflow-hidden mb-4" style={{ height: "220px" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={coverImage}
        alt="Cover"
        className="w-full h-full object-cover"
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />

      {/* Action buttons */}
      <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white text-xs font-medium rounded-lg backdrop-blur-sm transition-colors"
        >
          <Upload className="h-3 w-3" />
          {uploading ? "Uploading…" : "Change"}
        </button>
        <button
          type="button"
          onClick={handleRemove}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white text-xs font-medium rounded-lg backdrop-blur-sm transition-colors"
        >
          <X className="h-3 w-3" />
          Remove
        </button>
      </div>

      {fileInput}
    </div>
  );
}
