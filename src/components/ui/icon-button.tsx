import * as React from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ICON_SIZES = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-10 w-10",
} as const;

export interface IconButtonProps extends Omit<ButtonProps, "size"> {
  /**
   * Required — icon-only controls must have an accessible name.
   * (This is why IconButton exists: it makes the label non-optional at the type
   * level so a bare icon can never ship without one.)
   */
  "aria-label": string;
  size?: keyof typeof ICON_SIZES;
}

/**
 * Square, icon-only button built on the shared Button (so it inherits the
 * focus ring + press feedback). Use for any control whose entire content is an
 * icon. Default variant is `ghost`; pass `variant` for others.
 */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = "md", variant = "ghost", ...props }, ref) => (
    <Button
      ref={ref}
      variant={variant}
      size="icon"
      className={cn(ICON_SIZES[size], "shrink-0", className)}
      {...props}
    />
  )
);
IconButton.displayName = "IconButton";
