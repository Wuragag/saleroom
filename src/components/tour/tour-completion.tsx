"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TourCompletionProps {
  onCreatePage: () => void;
  onFinish: () => void;
}

// Forest-green brand family (rebranded chart tokens) instead of off-brand rainbow.
const CONFETTI_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary))",
];

export function TourCompletion({ onCreatePage, onFinish }: TourCompletionProps) {
  const [showConfetti, setShowConfetti] = useState(true);

  // Auto-hide confetti after 3s
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
      {/* Confetti particles */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-[62]">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20 + 5}%`,
                width: `${Math.random() * 8 + 4}px`,
                height: `${Math.random() * 8 + 4}px`,
                backgroundColor:
                  CONFETTI_COLORS[
                    Math.floor(Math.random() * CONFETTI_COLORS.length)
                  ],
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                animationDuration: `${Math.random() * 2 + 1.5}s`,
                animationDelay: `${Math.random() * 0.8}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Completion card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-completion-title"
        className="bg-card rounded-2xl shadow-2xl border border-border max-w-md w-full p-8 text-center animate-dopamine-bounce relative z-[63]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onFinish}
          aria-label="Close"
          className="absolute right-3 top-3 h-8 w-8 text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Animated checkmark circle */}
        <div className="mx-auto mb-5 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center animate-success-pulse">
          <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" style={{ strokeDasharray: 20, animation: "check-draw 0.4s ease-out 0.3s both" }} />
          </svg>
        </div>

        {/* Title */}
        <h2
          id="tour-completion-title"
          className="text-xl font-bold text-foreground mb-2"
        >
          You&apos;re All Set!
        </h2>

        {/* Progress complete bar */}
        <div className="w-full h-1.5 bg-border rounded-full mb-4 overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-progress-fill" style={{ width: "100%" }} />
        </div>

        {/* Subtitle */}
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          You now know the essentials. Create your first page and start
          closing more deals.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <Button
            type="button"
            onClick={onCreatePage}
            className="w-full h-10 rounded-xl text-sm font-semibold animate-glow-pulse"
          >
            Create Your First Page
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onFinish}
            className="w-full h-10 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
