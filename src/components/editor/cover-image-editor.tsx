"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon, Upload, X, AlertCircle } from "lucide-react";

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

  /* ── Empty state ── */
  if (!coverImage) {
    return (
      <div className="flex flex-col gap-1 mb-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="group flex items-center gap-2 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors text-xs font-medium w-fit"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          {uploading ? "Uploading…" : "Add cover image"}
          {fileInput}
        </button>
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-destructive px-3">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {error}
          </div>
        )}
      </div>
    );
  }

  /* ── Cover image set ── */
  return (
    <div className="mb-4">
      <div className="group relative w-full rounded-xl overflow-hidden" style={{ height: "220px" }}>
        <Image
          src={coverImage}
          alt="Cover"
          fill
          sizes="(max-width: 768px) 100vw, 720px"
          className="object-cover"
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
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-destructive mt-1.5 px-1">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
