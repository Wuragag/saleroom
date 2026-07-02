"use client";

import { useEffect, useRef } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TourWelcomeDialogProps {
  onStart: () => void;
  onSkip: () => void;
}

export function TourWelcomeDialog({ onStart, onSkip }: TourWelcomeDialogProps) {
  const startButtonRef = useRef<HTMLButtonElement>(null);

  // Move focus to the primary action when the dialog mounts
  useEffect(() => {
    startButtonRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-welcome-title"
        className="bg-card rounded-2xl shadow-2xl border border-border max-w-md w-full p-8 text-center animate-in fade-in-0 zoom-in-95 duration-300 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onSkip}
          aria-label="Close tour"
          className="absolute right-3 top-3 h-8 w-8 text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Icon */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>

        {/* Title */}
        <h2
          id="tour-welcome-title"
          className="text-xl font-bold text-foreground mb-2"
        >
          Welcome to SalesRoom!
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          Let me show you around in 30 seconds.
          <br />
          You&apos;ll learn how to create pages, use AI tools, and track
          performance.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <Button
            ref={startButtonRef}
            type="button"
            onClick={onStart}
            className="w-full h-10 rounded-xl text-sm font-semibold"
          >
            Start Tour
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onSkip}
            className="w-full h-10 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            I&apos;ll explore on my own
          </Button>
        </div>
      </div>
    </div>
  );
}
