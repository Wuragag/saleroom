import * as React from "react";

import { cn } from "@/lib/utils";

const WIDTHS = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  full: "max-w-none",
} as const;

export interface PageContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Content max-width. `md` (max-w-5xl) is the app default. */
  size?: keyof typeof WIDTHS;
}

/**
 * Standard centered page shell — the single source of horizontal max-width and
 * page padding. Every app route body should wrap its content in this instead of
 * repeating `max-w-* mx-auto px-6 py-6`.
 */
export function PageContainer({
  size = "md",
  className,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full px-6 py-6", WIDTHS[size], className)}
      {...props}
    />
  );
}
