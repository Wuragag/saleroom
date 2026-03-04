"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, AlertCircle, Sparkles } from "lucide-react";
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

  const isProcessing = status === "uploading" || status === "processing";

  const handleOpenChange = (open: boolean) => {
    if (!open && isProcessing) return; // prevent close during AI processing
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

  const uploadFileRef = useRef(uploadFile);
  uploadFileRef.current = uploadFile;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFileRef.current(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        {/* Gradient accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#003B22] to-[#0d9488] dark:from-[#0d7a5f] dark:to-[#14b8a6]" />

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-[#003B22] to-[#0d9488] dark:from-[#0d7a5f] dark:to-[#14b8a6]">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            AI Document Import
          </DialogTitle>
          <DialogDescription>
            Upload a PDF, DOCX, or PPTX file. Our AI will intelligently convert
            it into a fully editable page.
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
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? "border-primary bg-primary/5 shadow-[0_0_20px_-4px_rgba(0,59,34,0.15)] dark:shadow-[0_0_20px_-4px_rgba(20,184,166,0.15)]"
                : "border-border hover:border-primary/40 hover:bg-muted/50 hover:shadow-[0_0_15px_-4px_rgba(0,59,34,0.08)] dark:hover:shadow-[0_0_15px_-4px_rgba(20,184,166,0.08)]"
            }`}
          >
            <div className="relative mx-auto mb-3 w-12 h-12 flex items-center justify-center">
              <div
                className={`absolute inset-0 rounded-full transition-colors duration-200 ${
                  isDragging ? "bg-primary/10" : "bg-muted"
                }`}
              />
              <Upload
                className={`relative h-6 w-6 transition-colors duration-200 ${
                  isDragging ? "text-primary" : "text-muted-foreground"
                }`}
              />
            </div>
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
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors duration-200 ${
                    isDragging
                      ? "bg-primary/10 text-primary dark:bg-primary/20"
                      : "bg-muted text-muted-foreground"
                  }`}
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
            <div className="relative mx-auto mb-4 w-14 h-14 flex items-center justify-center">
              {/* Gradient ring spinner */}
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#003B22] border-r-[#0d9488] dark:border-t-[#0d7a5f] dark:border-r-[#14b8a6] animate-spin" />
              {/* Inner sparkle icon */}
              <Sparkles className="h-5 w-5 text-primary animate-ai-sparkle" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {status === "uploading"
                ? "Uploading document…"
                : "AI is analyzing and converting…"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Extracting content, formatting, and structure
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
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary/60" />
            <span>
              AI extracts text, images, and formatting into a fully editable
              page
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
