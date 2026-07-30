"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Building2, Check, ChevronDown, Plus, Search, X } from "lucide-react";

import { apiClient, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { CompanyOption } from "@/types";

interface CompanyPickerProps {
  /** Every company in scope — the list the user picks from. */
  companies: CompanyOption[];
  value: CompanyOption | null;
  onChange: (company: CompanyOption | null) => void;
  /** Called after a company is created here, so the owner can refresh its list. */
  onCompanyCreated?: (company: CompanyOption) => void;
  placeholder?: string;
  /** Renders borderless, for inline use in a page header. */
  variant?: "field" | "inline";
  className?: string;
  id?: string;
}

/**
 * Company selector: pick an existing company, or create one without leaving
 * the form. Companies are a real entity now, so typing a free-text name is no
 * longer how they're made — that quietly forked near-duplicate records.
 */
export function CompanyPicker({
  companies,
  value,
  onChange,
  onCompanyCreated,
  placeholder = "Select company",
  variant = "field",
  className,
  id,
}: CompanyPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => c.name.toLowerCase().includes(q));
  }, [companies, query]);

  const trimmed = query.trim();
  // Matching mirrors the server's case-insensitive resolve, so the CTA never
  // offers to create something that would just join an existing company.
  const exactMatch = companies.find(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase()
  );

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const select = (company: CompanyOption | null) => {
    onChange(company);
    close();
  };

  const create = async () => {
    if (!trimmed || creating) return;
    if (exactMatch) {
      select(exactMatch);
      return;
    }
    setCreating(true);
    try {
      const company = await apiClient.post<CompanyOption>("/api/deals/companies", {
        name: trimmed,
      });
      const created = { id: company.id, name: company.name };
      onCompanyCreated?.(created);
      toast.success(`Created ${created.name}`);
      select(created);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create company");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          aria-label={placeholder}
          className={cn(
            "flex items-center gap-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            variant === "field"
              ? "h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm text-foreground hover:border-foreground/30"
              : "-mx-1 rounded-lg px-1 text-body text-muted-foreground hover:bg-muted/40",
            className
          )}
        >
          {variant === "inline" && <Building2 className="h-3.5 w-3.5 shrink-0" />}
          <span
            className={cn(
              "min-w-0 flex-1 truncate",
              !value && variant === "field" && "text-muted-foreground",
              !value && variant === "inline" && "text-muted-foreground/60"
            )}
          >
            {value?.name ?? placeholder}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-64 p-0">
        <div className="relative border-b border-border">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (filtered.length === 1) select(filtered[0]);
                else if (trimmed) create();
              }
            }}
            placeholder="Search companies…"
            aria-label="Search companies"
            autoFocus
            className="h-9 w-full bg-transparent pl-8 pr-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
          />
        </div>

        <div className="max-h-56 overflow-y-auto py-1">
          {value && (
            <button
              type="button"
              onClick={() => select(null)}
              className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted"
            >
              <X className="h-3.5 w-3.5 shrink-0" />
              No company
            </button>
          )}

          {filtered.map((company) => (
            <button
              key={company.id}
              type="button"
              onClick={() => select(company)}
              className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-muted"
            >
              <span className="w-4 shrink-0">
                {company.id === value?.id && <Check className="h-3.5 w-3.5" />}
              </span>
              <span className="min-w-0 flex-1 truncate">{company.name}</span>
            </button>
          ))}

          {filtered.length === 0 && (
            <p className="px-2.5 py-3 text-center text-xs text-muted-foreground">
              {companies.length === 0
                ? "No companies yet."
                : "No match — create it below."}
            </p>
          )}
        </div>

        <div className="border-t border-border p-1">
          <button
            type="button"
            disabled={creating}
            onClick={() => {
              if (!trimmed) {
                searchRef.current?.focus();
                return;
              }
              create();
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" />
            <span className="min-w-0 flex-1 truncate">
              {creating
                ? "Creating…"
                : trimmed && !exactMatch
                  ? `Create “${trimmed}”`
                  : "Create company"}
            </span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
