import * as React from "react";

import { cn, hashToIndex, initials } from "@/lib/utils";

const MONO_SIZES = {
  sm: "h-8 w-8 rounded-md text-[0.8125rem]",
  md: "h-10 w-10 rounded-lg text-base",
  lg: "h-12 w-12 rounded-lg text-lg",
  xl: "h-14 w-14 rounded-xl text-xl",
} as const;

/**
 * Deterministic tonal hues for monogram tiles. Restrained, editorial — each is
 * rendered as a dark diagonal gradient (two lightness stops of the same hue)
 * with white serif initials. Kept here (a ui/ primitive) so feature code never
 * hardcodes tile colors.
 */
const MONO_HUES = [222, 262, 152, 28, 330, 190, 12, 96];

export interface MonogramProps {
  /** Display name — drives both the serif initials and the deterministic tone. */
  name: string;
  size?: keyof typeof MONO_SIZES;
  className?: string;
}

/**
 * Monogram tile — a rounded square with a deterministic tonal gradient and
 * serif initials from the name. Used for pages, workspaces, and named people in
 * tables. Anonymous visitors get the round {@link Avatar} instead.
 */
export function Monogram({ name, size = "md", className }: MonogramProps) {
  const hue = MONO_HUES[hashToIndex(name || "?", MONO_HUES.length)];
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center font-display leading-none text-white shadow-elevation-1",
        MONO_SIZES[size],
        className
      )}
      style={{
        backgroundImage: `linear-gradient(145deg, hsl(${hue} 24% 42%), hsl(${hue} 32% 22%))`,
      }}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
