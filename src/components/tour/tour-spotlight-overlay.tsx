"use client";

import type { TargetRect } from "@/hooks/use-product-tour";

interface TourSpotlightOverlayProps {
  targetRect: TargetRect | null;
}

const PADDING = 8;

export function TourSpotlightOverlay({
  targetRect,
}: TourSpotlightOverlayProps) {
  if (!targetRect) return null;

  return (
    <div
      className="fixed z-[60] pointer-events-none transition-all duration-300 ease-out"
      style={{
        top: targetRect.top - PADDING,
        left: targetRect.left - PADDING,
        width: targetRect.width + PADDING * 2,
        height: targetRect.height + PADDING * 2,
        borderRadius: 12,
        boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)",
      }}
    />
  );
}
