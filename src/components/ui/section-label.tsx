import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The small uppercase section label used throughout the editor panels and
 * settings sections. One place to change the label treatment for a reskin.
 */
export function SectionLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-3xs font-semibold uppercase tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}
