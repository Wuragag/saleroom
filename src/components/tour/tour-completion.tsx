"use client";

import { useState, useEffect } from "react";

interface TourCompletionProps {
  onCreatePage: () => void;
  onFinish: () => void;
}

const CONFETTI_COLORS = [
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
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
        className="bg-card rounded-2xl shadow-2xl border border-border max-w-md w-full p-8 text-center animate-dopamine-bounce relative z-[63]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated checkmark circle */}
        <div className="mx-auto mb-5 h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center animate-success-pulse">
          <svg className="h-8 w-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" style={{ strokeDasharray: 20, animation: "check-draw 0.4s ease-out 0.3s both" }} />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-foreground mb-2">
          You&apos;re All Set!
        </h2>

        {/* Progress complete bar */}
        <div className="w-full h-1.5 bg-border rounded-full mb-4 overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full animate-progress-fill" style={{ width: "100%" }} />
        </div>

        {/* Subtitle */}
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          You now know the essentials. Create your first page and start
          closing more deals.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onCreatePage}
            className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-[0.97] transition-all duration-150 animate-glow-pulse"
          >
            Create Your First Page
          </button>
          <button
            onClick={onFinish}
            className="w-full h-10 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted active:scale-[0.97] transition-all duration-150"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
