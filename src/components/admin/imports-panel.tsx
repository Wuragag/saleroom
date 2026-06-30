"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/api-client";

interface ImportRow {
  id: string;
  title: string;
  slug: string;
  importStatus: string;
  importError: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string | null;
    email: string;
  };
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: typeof Clock }
> = {
  processing: {
    label: "Processing",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    icon: Clock,
  },
  complete: {
    label: "Complete",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    icon: CheckCircle2,
  },
  error: {
    label: "Error",
    className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    icon: AlertCircle,
  },
};

const FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "processing", label: "Processing" },
  { value: "complete", label: "Complete" },
  { value: "error", label: "Error" },
];

export function ImportsPanel() {
  const [imports, setImports] = useState<ImportRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const LIMIT = 20;

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const fetchImports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      const data = await apiClient.get<{ imports: ImportRow[]; total: number }>(`/api/admin/imports?${params}`);
      setImports(data.imports ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load imports");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchImports();
  }, [fetchImports]);

  const handleRetry = async (importItem: ImportRow) => {
    setRetryingId(importItem.id);
    try {
      await apiClient.post(`/api/admin/imports/${importItem.id}/retry`);
      setImports((prev) =>
        prev.map((i) =>
          i.id === importItem.id
            ? { ...i, importStatus: "processing", importError: null }
            : i
        )
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to retry import");
    } finally {
      setRetryingId(null);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, name, or email…"
          className="w-full max-w-sm px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />

        {/* Status filter pills */}
        <div className="flex items-center gap-1">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setStatusFilter(opt.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                statusFilter === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Title
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                User
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Status
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Error
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Created
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
                </td>
              </tr>
            ) : imports.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground"
                >
                  No imports found
                </td>
              </tr>
            ) : (
              imports.map((item) => {
                const config = STATUS_CONFIG[item.importStatus] ?? STATUS_CONFIG.processing;
                const StatusIcon = config.icon;
                const isStuck =
                  item.importStatus === "processing" &&
                  Date.now() - new Date(item.updatedAt).getTime() > 5 * 60 * 1000;

                return (
                  <tr
                    key={item.id}
                    className="border-t border-border hover:bg-muted/30 transition-colors"
                  >
                    {/* Title */}
                    <td className="px-4 py-3 font-medium text-foreground max-w-[200px] truncate">
                      {item.title}
                    </td>

                    {/* User */}
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex flex-col">
                        <span className="text-foreground text-xs font-medium">
                          {item.user.name ?? "—"}
                        </span>
                        <span className="text-[11px]">{item.user.email}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${config.className}`}
                      >
                        {item.importStatus === "processing" ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <StatusIcon className="h-3 w-3" />
                        )}
                        {config.label}
                        {isStuck && (
                          <span className="ml-1 text-amber-600 dark:text-amber-400">
                            (stuck)
                          </span>
                        )}
                      </span>
                    </td>

                    {/* Error */}
                    <td className="px-4 py-3 text-muted-foreground max-w-[250px]">
                      {item.importError ? (
                        <span
                          className="text-xs text-red-600 dark:text-red-400 truncate block"
                          title={item.importError}
                        >
                          {item.importError}
                        </span>
                      ) : (
                        <span className="text-xs italic">—</span>
                      )}
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      {(item.importStatus === "error" || isStuck) && (
                        <button
                          onClick={() => handleRetry(item)}
                          disabled={retryingId === item.id}
                          aria-label={`Retry import for ${item.title ?? item.id}`}
                          className="flex items-center gap-1.5 rounded px-1.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {retryingId === item.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3.5 w-3.5" />
                          )}
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} import{total !== 1 ? "s" : ""} total
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
