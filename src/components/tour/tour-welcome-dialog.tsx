"use client";

import { Sparkles } from "lucide-react";

interface TourWelcomeDialogProps {
  onStart: () => void;
  onSkip: () => void;
}

export function TourWelcomeDialog({ onStart, onSkip }: TourWelcomeDialogProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
      <div
        className="bg-card rounded-2xl shadow-2xl border border-border max-w-md w-full p-8 text-center animate-in fade-in-0 zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-foreground mb-2">
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
          <button
            onClick={onStart}
            className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Start Tour
          </button>
          <button
            onClick={onSkip}
            className="w-full h-10 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            I&apos;ll explore on my own
          </button>
        </div>
      </div>
    </div>
  );
}
