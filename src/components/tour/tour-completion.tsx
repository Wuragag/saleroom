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
        className="bg-card rounded-2xl shadow-2xl border border-border max-w-md w-full p-8 text-center animate-in fade-in-0 zoom-in-95 duration-300 relative z-[63]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Emoji */}
        <div className="text-5xl mb-4">
          <span role="img" aria-label="party popper">
            🎉
          </span>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-foreground mb-2">
          You&apos;re All Set!
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          You now know the essentials. Create your first page and start
          closing more deals.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onCreatePage}
            className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Create Your First Page
          </button>
          <button
            onClick={onFinish}
            className="w-full h-10 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
