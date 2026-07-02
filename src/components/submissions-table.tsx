"use client";

import { useState, useMemo } from "react";
import { Download, FileText, Search, X, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Submission {
  id: string;
  pageId: string;
  formId: string;
  data: string;
  createdAt: string;
  pageTitle: string;
}

interface SubmissionsTableProps {
  submissions: Submission[];
  pages: Array<{ id: string; title: string; slug: string }>;
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatKey(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/^field\s*\d+\s*/i, "")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function SubmissionsTable({ submissions, pages }: SubmissionsTableProps) {
  const [filterPageId, setFilterPageId] = useState<string>("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let arr = filterPageId ? submissions.filter((s) => s.pageId === filterPageId) : submissions;
    const q = search.trim().toLowerCase();
    if (q) {
      arr = arr.filter((s) => {
        if (s.pageTitle.toLowerCase().includes(q)) return true;
        try {
          const data = JSON.parse(s.data) as Record<string, string>;
          return Object.values(data).some((v) => String(v).toLowerCase().includes(q));
        } catch { return false; }
      });
    }
    return arr;
  }, [submissions, filterPageId, search]);

  const fieldKeys = useMemo(() => {
    const keys = new Set<string>();
    filtered.forEach((s) => {
      try {
        Object.keys(JSON.parse(s.data)).forEach((k) => keys.add(k));
      } catch { /* ignore */ }
    });
    return Array.from(keys);
  }, [filtered]);

  const parseData = (dataStr: string): Record<string, string> => {
    try { return JSON.parse(dataStr); } catch { return {}; }
  };

  const exportCsv = () => {
    const headers = ["Page", "Date", ...fieldKeys.map(formatKey)];
    const rows = filtered.map((s) => {
      const data = parseData(s.data);
      return [s.pageTitle, formatDate(s.createdAt), ...fieldKeys.map((k) => data[k] || "")];
    });
    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `submissions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activePageTitle = pages.find((p) => p.id === filterPageId)?.title;
  const hasFilters = !!filterPageId || !!search.trim();

  if (submissions.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No form submissions yet"
        description="Add a form block to your pages to start collecting leads."
      />
    );
  }

  return (
    <div>
      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-5">

        {/* Page filter dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-pressed={!!filterPageId}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                filterPageId
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              <FileText className="h-3 w-3" />
              {activePageTitle ?? "All Pages"}
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuItem onClick={() => setFilterPageId("")} className="gap-2 cursor-pointer">
              <span className="w-4 shrink-0">
                {!filterPageId && <Check className="h-3.5 w-3.5 text-primary" />}
              </span>
              All Pages
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {pages.map((p) => (
              <DropdownMenuItem
                key={p.id}
                onClick={() => setFilterPageId(filterPageId === p.id ? "" : p.id)}
                className="gap-2 cursor-pointer"
              >
                <span className="w-4 shrink-0">
                  {filterPageId === p.id && <Check className="h-3.5 w-3.5 text-primary" />}
                </span>
                <span className="truncate">{p.title}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Count */}
        <span className="text-xs text-muted-foreground shrink-0">
          {filtered.length} submission{filtered.length !== 1 ? "s" : ""}
        </span>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={() => { setFilterPageId(""); setSearch(""); }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        <div className="relative shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search…"
            aria-label="Search submissions"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-40 pl-7 pr-6 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus:border-primary/50 focus:w-52 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Export */}
        <Button
          variant="outline"
          size="sm"
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Export CSV</span>
        </Button>
      </div>

      {/* ── Table ───────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="border border-border rounded-xl bg-card">
          <EmptyState
            icon={Search}
            title="No submissions match your filters"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setFilterPageId(""); setSearch(""); }}
              >
                Clear filters
              </Button>
            }
          />
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Header */}
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th scope="col" className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
                    Page
                  </th>
                  <th scope="col" className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
                    Submitted
                  </th>
                  {fieldKeys.map((key) => (
                    <th
                      key={key}
                      scope="col"
                      className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap"
                    >
                      {formatKey(key)}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Rows */}
              <tbody className="divide-y divide-border">
                {filtered.map((s) => {
                  const data = parseData(s.data);
                  return (
                    <tr key={s.id} className="hover:bg-muted/40 transition-colors group">
                      {/* Page */}
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-foreground">{s.pageTitle}</span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-foreground">{timeAgo(s.createdAt)}</span>
                        <span className="block text-xs text-muted-foreground mt-0.5">{formatDate(s.createdAt)}</span>
                      </td>

                      {/* Field values */}
                      {fieldKeys.map((key) => (
                        <td key={key} className="px-4 py-3 max-w-[200px]">
                          <span className="text-sm text-foreground truncate block">
                            {data[key] || <span className="text-muted-foreground">—</span>}
                          </span>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
