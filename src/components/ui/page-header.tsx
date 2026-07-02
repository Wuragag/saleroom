import * as React from "react";

import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  description?: string;
  /** Right-aligned actions (buttons). Wraps under the title on narrow screens. */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Standard page title block (title + description + actions). Replaces the
 * copy-pasted `h2 + p + button-row` header used on every app screen.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground text-sm mt-0.5">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
