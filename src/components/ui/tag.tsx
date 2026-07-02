import * as React from "react";

import { cn, hashToIndex } from "@/lib/utils";

// Number of categorical hues defined as --cat-1..N in globals.css.
const CAT_COUNT = 6;

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  label: string;
  size?: "sm" | "md";
}

/**
 * A small labelled chip whose color is derived deterministically from the label
 * via the tokenized `--cat-*` palette. Replaces the hand-rolled hex TAG_PALETTE.
 */
export function Tag({ label, size = "md", className, ...props }: TagProps) {
  const idx = hashToIndex(label, CAT_COUNT) + 1;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium px-2 py-0.5",
        size === "sm" ? "text-3xs" : "text-2xs",
        className
      )}
      style={{
        backgroundColor: `hsl(var(--cat-${idx}) / 0.14)`,
        color: `hsl(var(--cat-${idx}))`,
      }}
      {...props}
    >
      {label}
    </span>
  );
}
