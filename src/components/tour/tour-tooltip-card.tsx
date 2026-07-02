"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TourStep } from "./tour-steps";
import type { TargetRect } from "./use-product-tour";

interface TourTooltipCardProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  targetRect: TargetRect;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

const TOOLTIP_GAP = 16;
const TOOLTIP_WIDTH = 340;

function computePosition(
  targetRect: TargetRect,
  preferred: TourStep["position"]
): { top: number; left: number; actualPosition: "top" | "bottom" } {
  // We only support top/bottom for now since all targets are horizontal buttons
  const spaceBelow =
    window.innerHeight - (targetRect.top + targetRect.height);
  const spaceAbove = targetRect.top;

  let actualPosition: "top" | "bottom" =
    preferred === "top" ? "top" : "bottom";

  // Flip if not enough room (estimate tooltip height ~200px)
  if (actualPosition === "bottom" && spaceBelow < 220) {
    actualPosition = "top";
  } else if (actualPosition === "top" && spaceAbove < 220) {
    actualPosition = "bottom";
  }

  // Center horizontally on target
  let left =
    targetRect.left + targetRect.width / 2 - TOOLTIP_WIDTH / 2;

  // Clamp to viewport
  const rightEdge = window.innerWidth - 16;
  if (left + TOOLTIP_WIDTH > rightEdge) left = rightEdge - TOOLTIP_WIDTH;
  if (left < 16) left = 16;

  let top: number;
  if (actualPosition === "bottom") {
    top = targetRect.top + targetRect.height + TOOLTIP_GAP;
  } else {
    // Position above — we'll let it auto-adjust
    top = targetRect.top - TOOLTIP_GAP;
  }

  return { top, left, actualPosition };
}

export function TourTooltipCard({
  step,
  stepIndex,
  totalSteps,
  targetRect,
  onNext,
  onPrev,
  onSkip,
}: TourTooltipCardProps) {
  const { top, left, actualPosition } = computePosition(
    targetRect,
    step.position
  );

  const isLast = stepIndex === totalSteps - 1;

  return (
    <div
      className="fixed z-[61] animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
      style={{
        top: actualPosition === "bottom" ? top : undefined,
        bottom:
          actualPosition === "top"
            ? window.innerHeight - top
            : undefined,
        left,
        width: TOOLTIP_WIDTH,
      }}
    >
      <div className="bg-card rounded-xl border border-border shadow-2xl p-5">
        {/* Title */}
        <h3 className="text-sm font-bold text-foreground mb-1.5">
          {step.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
          {step.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Step dots + progress */}
          <div
            className="flex flex-col gap-2"
            role="img"
            aria-label={`Step ${stepIndex + 1} of ${totalSteps}`}
          >
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ease-out ${
                    i === stepIndex
                      ? "w-5 bg-primary animate-glow-pulse"
                      : i < stepIndex
                      ? "w-1.5 bg-primary/60"
                      : "w-1.5 bg-muted-foreground/20"
                  }`}
                />
              ))}
            </div>
            <span
              className="text-3xs text-muted-foreground font-medium tabular-nums"
              aria-hidden="true"
            >
              {stepIndex + 1}/{totalSteps}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="h-8 px-2 text-2xs text-muted-foreground hover:text-foreground"
            >
              Skip
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onPrev}
              disabled={stepIndex === 0}
              className="h-8 w-8 rounded-lg"
              aria-label="Previous step"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={onNext}
              className="h-8 px-3 rounded-lg text-xs font-semibold"
            >
              {isLast ? "Finish" : "Next"}
              {!isLast && <ChevronRight className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
