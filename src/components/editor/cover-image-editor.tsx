"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon, Upload, X, AlertCircle } from "lucide-react";

interface CoverImageEditorProps {
  pageId: string;
  coverImage: string;
  onCoverImageChange: (url: string) => void;
  /** Content-column width — aligns the empty-state button with the page column */
  maxWidth?: string;
}

export function CoverImageEditor({
  pageId,
  coverImage,
  onCoverImageChange,
  maxWidth,
}: CoverImageEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await fetch(`/api/pages/${pageId}/cover`, {
        method: "POST",
        body: formData,
      });

      const data = await uploadRes.json();

      if (!uploadRes.ok) {
        setError(data?.error ?? `Upload failed (${uploadRes.status})`);
        return;
      }

      const { url } = data;

      // Persist to the page
      const saveRes = await fetch(`/api/pages/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverImage: url }),
      });

      if (!saveRes.ok) {
        setError("Image uploaded but failed to save. Please try again.");
        return;
      }

      onCoverImageChange(url);
    } catch (err) {
      console.error("Cover upload error:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setUploading(false);
      // Reset file input so the same file can be re-selected
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    setError(null);
    // Optimistically update UI
    const previousImage = coverImage;
    onCoverImageChange("");
    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverImage: "" }),
      });
      if (!res.ok) {
        throw new Error("Failed to remove cover image");
      }
    } catch {
      // Rollback on failure
      onCoverImageChange(previousImage);
      setError("Failed to remove cover image. Please try again.");
    }
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

  /* ── Empty state: slim ghost affordance aligned with the content column ── */
  if (!coverImage) {
    return (
      <div className="relative z-20 mx-auto px-6 pt-4" style={{ maxWidth }}>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-border/80 bg-background/60 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:border-border transition-colors text-xs font-medium w-fit focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          {uploading ? "Uploading…" : "Add cover image"}
          {fileInput}
        </button>
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-destructive px-3 pt-1">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {error}
          </div>
        )}
      </div>
    );
  }

  /* ── Cover image set: full-bleed, same 300px height as the published page ── */
  return (
    <div className="group relative z-10 w-full" style={{ height: "300px" }}>
      <Image
        src={coverImage}
        alt=""
        fill
        sizes="100vw"
        priority
        style={{ objectFit: "cover" }}
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />

      {/* Action buttons */}
      <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white text-xs font-medium rounded-lg backdrop-blur-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Upload className="h-3 w-3" />
          {uploading ? "Uploading…" : "Change"}
        </button>
        <button
          type="button"
          onClick={handleRemove}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white text-xs font-medium rounded-lg backdrop-blur-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <X className="h-3 w-3" />
          Remove
        </button>
      </div>

      {error && (
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs text-white bg-destructive/90 px-2.5 py-1.5 rounded-lg">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </div>
      )}

      {fileInput}
    </div>
  );
}
