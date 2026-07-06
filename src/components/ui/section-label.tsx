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
        "text-caption font-semibold uppercase text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}
