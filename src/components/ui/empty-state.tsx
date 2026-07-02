import * as React from "react";
import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Optional CTA (usually a Button). */
  action?: React.ReactNode;
  className?: string;
}

/**
 * The single empty/zero-data state used across the app (dashboard, tables,
 * library, filtered lists). Replaces the several bespoke empty layouts.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("text-center py-16", className)}>
      {Icon && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
