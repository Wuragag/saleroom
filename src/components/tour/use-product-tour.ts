"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TOUR_STEPS, STORAGE_KEY, type TourStep } from "./tour-steps";

export type TourState = "idle" | "welcome" | "spotlight" | "completion";

export interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface ProductTourHook {
  state: TourState;
  currentStep: TourStep | null;
  stepIndex: number;
  totalSteps: number;
  targetRect: TargetRect | null;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  finishTour: () => void;
}

function getFilteredSteps(): TourStep[] {
  if (typeof window === "undefined") return TOUR_STEPS;
  const isMobile = window.innerWidth < 768;
  return isMobile ? TOUR_STEPS.filter((s) => !s.desktopOnly) : TOUR_STEPS;
}

function getTargetRect(selector: string): TargetRect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

export function useProductTour(): ProductTourHook {
  const [state, setState] = useState<TourState>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const rafRef = useRef<number>(0);

  // Initialize: check localStorage and set initial state
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      setState("welcome");
    }
    setSteps(getFilteredSteps());
  }, []);

  // Update steps on resize (mobile ↔ desktop)
  useEffect(() => {
    function handleResize() {
      setSteps(getFilteredSteps());
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Recompute target rect when step changes or on scroll/resize
  useEffect(() => {
    if (state !== "spotlight" || !steps[stepIndex]) {
      setTargetRect(null);
      return;
    }

    function update() {
      const rect = getTargetRect(steps[stepIndex].targetSelector);
      setTargetRect(rect);
      rafRef.current = requestAnimationFrame(update);
    }

    // Small delay to let DOM settle
    const timeout = setTimeout(() => {
      update();
    }, 50);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(rafRef.current);
    };
  }, [state, stepIndex, steps]);

  // Scroll target element into view
  useEffect(() => {
    if (state !== "spotlight" || !steps[stepIndex]) return;

    const el = document.querySelector(steps[stepIndex].targetSelector);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [state, stepIndex, steps]);

  const markComplete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
  }, []);

  const startTour = useCallback(() => {
    setStepIndex(0);
    setState("spotlight");
  }, []);

  const nextStep = useCallback(() => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      setState("completion");
    }
  }, [stepIndex, steps.length]);

  const prevStep = useCallback(() => {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
    }
  }, [stepIndex]);

  const skipTour = useCallback(() => {
    markComplete();
    setState("idle");
  }, [markComplete]);

  const finishTour = useCallback(() => {
    markComplete();
    setState("idle");
  }, [markComplete]);

  return {
    state,
    currentStep: steps[stepIndex] ?? null,
    stepIndex,
    totalSteps: steps.length,
    targetRect,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    finishTour,
  };
}
