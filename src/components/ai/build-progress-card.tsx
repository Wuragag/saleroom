"use client";

import { Check, Loader2, Circle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProgressStep {
  id: string;
  label: string;
  status: "pending" | "active" | "done" | "error";
  note?: string;
}

/**
 * Live build checklist shown as an assistant message while the composer
 * assembles the page ("Writing 'Business Case'…"). Pure presentational —
 * the workspace patches step states as the real build progresses.
 */
export function BuildProgressCard({ steps }: { steps: ProgressStep[] }) {
  return (
    <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-border/60 bg-card px-4 py-3 shadow-sm">
      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.id} className="flex items-start gap-2.5 text-sm">
            <span className="mt-0.5 shrink-0">
              {step.status === "done" ? (
                <Check className="h-4 w-4 text-success" />
              ) : step.status === "active" ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : step.status === "error" ? (
                <AlertTriangle className="h-4 w-4 text-warning" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/30" />
              )}
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  "leading-snug",
                  step.status === "pending" && "text-muted-foreground/60",
                  step.status === "active" && "font-medium text-foreground",
                  step.status === "done" && "text-muted-foreground",
                  step.status === "error" && "text-foreground"
                )}
              >
                {step.label}
              </span>
              {step.note && (
                <span className="block text-xs text-warning-subtle-foreground">
                  {step.note}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
