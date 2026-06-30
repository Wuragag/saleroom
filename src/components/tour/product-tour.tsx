"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useProductTour } from "./use-product-tour";
import { TourWelcomeDialog } from "./tour-welcome-dialog";
import { TourSpotlightOverlay } from "./tour-spotlight-overlay";
import { TourTooltipCard } from "./tour-tooltip-card";
import { TourCompletion } from "./tour-completion";

export function ProductTour() {
  const router = useRouter();
  const {
    state,
    currentStep,
    stepIndex,
    totalSteps,
    targetRect,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    finishTour,
  } = useProductTour();

  const canGoBack = stepIndex > 0;

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (state === "idle") return;

      if (e.key === "Escape") {
        skipTour();
        return;
      }

      if (state === "spotlight") {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          nextStep();
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          // No "back" on the first step — leave the key as a no-op
          // instead of swallowing it with preventDefault.
          if (canGoBack) {
            e.preventDefault();
            prevStep();
          }
        } else if (e.key === "Enter") {
          e.preventDefault();
          nextStep();
        }
      }

      if (state === "welcome" && e.key === "Enter") {
        e.preventDefault();
        startTour();
      }
    },
    [state, skipTour, nextStep, prevStep, startTour, canGoBack]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Lock body scroll when tour is active
  useEffect(() => {
    if (state !== "idle") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [state]);

  if (state === "idle") return null;

  if (state === "welcome") {
    return <TourWelcomeDialog onStart={startTour} onSkip={skipTour} />;
  }

  if (state === "completion") {
    return (
      <TourCompletion
        onCreatePage={() => {
          finishTour();
          // Open template picker by clicking the New Page button
          const newPageBtn = document.querySelector(
            '[data-tour="new-page"]'
          ) as HTMLButtonElement | null;
          if (newPageBtn) {
            newPageBtn.click();
          } else {
            router.push("/");
          }
        }}
        onFinish={finishTour}
      />
    );
  }

  // state === "spotlight"
  if (!currentStep || !targetRect) return null;

  return (
    <>
      {/* Click-to-skip backdrop (areas outside the spotlight) */}
      <div
        className="fixed inset-0 z-[59]"
        onClick={skipTour}
        aria-hidden="true"
      />

      {/* Spotlight overlay */}
      <TourSpotlightOverlay targetRect={targetRect} />

      {/* Tooltip */}
      <TourTooltipCard
        step={currentStep}
        stepIndex={stepIndex}
        totalSteps={totalSteps}
        targetRect={targetRect}
        onNext={nextStep}
        onPrev={prevStep}
        onSkip={skipTour}
      />
    </>
  );
}
