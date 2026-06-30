"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, PenLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { toast } from "sonner";

const MAX_PROMPT_LENGTH = 2000;
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 120_000;

type Status = "idle" | "submitting" | "error";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Polls import status in the background and updates the toast.
 * Returns a cleanup function that cancels any pending poll.
 */
function pollAndToast(
  pageId: string,
  toastId: string | number,
  router: ReturnType<typeof useRouter>
): () => void {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let cancelled = false;

  const tick = async () => {
    if (cancelled) return;

    if (Date.now() > deadline) {
      toast.error(
        "Page generation is taking too long. Check the admin panel for status.",
        { id: toastId }
      );
      return;
    }

    try {
      const res = await fetch(`/api/import/status/${pageId}`);
      if (cancelled) return;
      if (!res.ok) throw new Error("Failed to check status");
      const data = await res.json();

      if (data.status === "complete") {
        toast.success("Page generated successfully!", {
          id: toastId,
          duration: 6000,
          action: {
            label: "Open",
            onClick: () => router.push(`/editor/${pageId}`),
          },
        });
        return;
      }

      if (data.status === "error") {
        toast.error(data.error || "Page generation failed. Please try again.", {
          id: toastId,
          duration: 8000,
        });
        return;
      }

      if (!cancelled) {
        timerId = setTimeout(tick, POLL_INTERVAL_MS);
      }
    } catch {
      if (!cancelled) {
        toast.error("Lost connection while checking generation status.", {
          id: toastId,
        });
      }
    }
  };

  timerId = setTimeout(tick, POLL_INTERVAL_MS);

  return () => {
    cancelled = true;
    if (timerId !== null) clearTimeout(timerId);
  };
}

export function AiWriteModal({ isOpen, onClose }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const cancelPollRef = useRef<(() => void) | null>(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      cancelPollRef.current?.();
    };
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setLimitError(null);
    setPrompt("");
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (!open && status === "submitting") return;
    if (!open) {
      reset();
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    setError(null);
    setLimitError(null);
    setStatus("submitting");

    try {
      const res = await fetch("/api/ai-write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "PLAN_LIMIT") {
          setLimitError(data.error);
          setStatus("idle");
          return;
        }
        setError(data.error || "Something went wrong.");
        setStatus("error");
        return;
      }

      // Close modal immediately
      reset();
      onClose();

      // Show loading toast
      const toastId = toast.loading("AI is writing your page…");

      // Fire-and-forget AI processing
      fetch(`/api/ai-write/process/${data.id}`, {
        method: "POST",
        keepalive: true,
      }).catch(() => {});

      // Poll in background (cancel any previous poll first)
      cancelPollRef.current?.();
      cancelPollRef.current = pollAndToast(data.id, toastId, router);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      setStatus("error");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        {/* Gradient accent bar */}
        <div className="gradient-ai absolute top-0 left-0 right-0 h-1" />

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="gradient-ai flex items-center justify-center w-7 h-7 rounded-lg">
              <PenLine className="h-3.5 w-3.5 text-white" />
            </div>
            AI Page Writer
          </DialogTitle>
          <DialogDescription>
            Describe the page you want and AI will generate it for you.
          </DialogDescription>
        </DialogHeader>

        {/* Limit error */}
        {limitError && <UpgradePrompt message={limitError} />}

        {/* Prompt input */}
        {status !== "submitting" && status !== "error" && !limitError && (
          <div className="space-y-3">
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A sales proposal for our enterprise cloud platform with pricing tiers, customer testimonials, and a timeline section..."
                maxLength={MAX_PROMPT_LENGTH}
                rows={4}
                className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleSubmit();
                  }
                }}
              />
              <span className="absolute bottom-2 right-2 text-[10px] text-muted-foreground">
                {prompt.length}/{MAX_PROMPT_LENGTH}
              </span>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!prompt.trim()}
              className="gradient-ai w-full rounded-lg gap-1.5 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Generate Page
            </Button>
          </div>
        )}

        {/* Submitting state */}
        {status === "submitting" && (
          <div className="py-8 text-center">
            <div className="relative mx-auto mb-4 w-14 h-14 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary/60 animate-spin" />
              <Sparkles className="h-5 w-5 text-primary animate-ai-sparkle" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Creating page…
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This will only take a moment
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

        {/* Footer hint */}
        {status !== "submitting" && status !== "error" && !limitError && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary/60" />
            <span>
              AI generates a complete page with headings, sections, and
              formatting
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
