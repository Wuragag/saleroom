"use client";

import { Check, ChevronDown } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { DealOwnerData } from "@/types";

export function memberDisplayName(m: DealOwnerData): string {
  return `${m.name} ${m.lastName}`.trim() || "Unknown";
}

interface MemberPickerProps {
  members: DealOwnerData[];
  value: string; // userId
  onChange: (userId: string) => void;
  /** Shown when `value` isn't in the roster (e.g. the owner left the team) —
   * without it the picker would misattribute the deal to members[0]. */
  fallback?: DealOwnerData;
  compact?: boolean;
  className?: string;
}

/** Deal-owner selector: avatar + name over the team roster. */
export function MemberPicker({
  members,
  value,
  onChange,
  fallback,
  compact = false,
  className,
}: MemberPickerProps) {
  const selected =
    members.find((m) => m.id === value) ?? fallback ?? members[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-2 rounded-lg border border-border bg-background text-left transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            compact ? "h-8 px-2 text-xs" : "h-9 px-2.5 text-sm",
            className
          )}
        >
          {selected && (
            <Avatar
              name={memberDisplayName(selected)}
              src={selected.avatarUrl || null}
              size="xs"
            />
          )}
          <span className="min-w-0 flex-1 truncate text-foreground">
            {selected ? memberDisplayName(selected) : "Select owner"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {members.map((m) => (
          <DropdownMenuItem
            key={m.id}
            onClick={() => onChange(m.id)}
            className="gap-2"
          >
            <Avatar name={memberDisplayName(m)} src={m.avatarUrl || null} size="xs" />
            <span className="min-w-0 flex-1 truncate">{memberDisplayName(m)}</span>
            <span className="w-4 shrink-0">
              {m.id === value && <Check className="h-4 w-4" />}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
