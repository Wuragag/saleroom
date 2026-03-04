"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { UpgradePrompt } from "@/components/upgrade-prompt";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

const ACCEPTED_EXTENSIONS = ".pdf,.docx,.pptx";
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

type Status = "idle" | "uploading" | "processing" | "error";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportDocumentModal({ isOpen, onClose }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setLimitError(null);
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
      onClose();
    }
  };

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Unsupported file type. Please upload a PDF, DOCX, or PPTX file.";
    }
    if (file.size > MAX_SIZE) {
      return "File must be under 10 MB.";
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setStatus("error");
      return;
    }

    setError(null);
    setLimitError(null);
    setStatus("uploading");

    try {
      const formData = new FormData();
      formData.append("file", file);

      setStatus("processing");

      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "PLAN_LIMIT") {
          setLimitError(data.error);
          setStatus("idle");
          return;
        }
        setError(data.error || "Import failed. Please try again.");
        setStatus("error");
        return;
      }

      // Success — navigate to editor
      router.push(`/editor/${data.id}`);
    } catch {
      setError("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const isProcessing = status === "uploading" || status === "processing";

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Document</DialogTitle>
          <DialogDescription>
            Upload a PDF, DOCX, or PPTX file. AI will convert it into an
            editable page.
          </DialogDescription>
        </DialogHeader>

        {/* Limit error */}
        {limitError && <UpgradePrompt message={limitError} />}

        {/* Drop zone */}
        {!isProcessing && status !== "error" && !limitError && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40 hover:bg-muted/50"
            }`}
          >
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">
              Drop your file here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Max file size: 10 MB
            </p>
            <div className="flex items-center justify-center gap-2">
              {["PDF", "DOCX", "PPTX"].map((ext) => (
                <span
                  key={ext}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                >
                  {ext}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Processing state */}
        {isProcessing && (
          <div className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
            <p className="text-sm font-medium text-foreground">
              {status === "uploading"
                ? "Uploading document…"
                : "AI is converting your document…"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This may take a moment
            </p>
          </div>
        )}

        {/* Error state */}
        {status === "error" && error && (
          <div className="py-6 text-center">
            <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-3" />
            <p className="text-sm text-destructive mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={reset}>
              Try Again
            </Button>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Footer hint */}
        {!isProcessing && status !== "error" && !limitError && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span>Your document will be converted into editable content</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
