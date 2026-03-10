"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/api-client";

interface TeamRow {
  id: string;
  name: string;
  createdAt: string;
  plan: string;
  status: string;
  memberCount: number;
  pageCount: number;
  owner: { name: string | null; email: string } | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
}

const PLAN_COLORS: Record<string, string> = {
  TEAM: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  PRO: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  FREE: "bg-muted text-muted-foreground",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "text-green-600 dark:text-green-400",
  PAST_DUE: "text-amber-600 dark:text-amber-400",
  CANCELED: "text-red-500",
  TRIALING: "text-blue-600 dark:text-blue-400",
};

export function TeamsPanel() {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [overridingId, setOverridingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
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

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      const data = await apiClient.get<{ teams: TeamRow[]; total: number }>(`/api/admin/teams?${params}`);
      setTeams(data.teams ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load teams");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handlePlanOverride = async (teamId: string, newPlan: string) => {
    // Optimistic update
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, plan: newPlan, status: "ACTIVE" } : t))
    );
    setOverridingId(teamId);
    try {
      await apiClient.put(`/api/admin/teams/${teamId}/subscription`, { plan: newPlan });
      setSavedId(teamId);
      setTimeout(() => setSavedId(null), 2000);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update plan");
      fetchTeams();
    } finally {
      setOverridingId(null);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-4">
      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by team name…"
        className="w-full max-w-sm px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
      />

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Team</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Owner</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Members</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Pages</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Override</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
                </td>
              </tr>
            ) : teams.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-muted-foreground">
                  No teams found
                </td>
              </tr>
            ) : (
              teams.map((team) => (
                <tr key={team.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{team.name}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {team.owner?.email ?? <span className="italic">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${
                        PLAN_COLORS[team.plan] ?? PLAN_COLORS.FREE
                      }`}
                    >
                      {team.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium ${
                        STATUS_COLORS[team.status] ?? "text-muted-foreground"
                      }`}
                    >
                      {team.status}
                      {team.cancelAtPeriodEnd && " (canceling)"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{team.memberCount}</td>
                  <td className="px-4 py-3 text-muted-foreground">{team.pageCount}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(team.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <select
                        value={team.plan}
                        onChange={(e) => handlePlanOverride(team.id, e.target.value)}
                        disabled={overridingId === team.id}
                        className="text-xs rounded-md border border-border bg-background px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                      >
                        <option value="FREE">Free</option>
                        <option value="PRO">Pro</option>
                        <option value="TEAM">Team</option>
                      </select>
                      {overridingId === team.id && (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground shrink-0" />
                      )}
                      {savedId === team.id && (
                        <Check className="h-3 w-3 text-green-600 dark:text-green-400 shrink-0" />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} team{total !== 1 ? "s" : ""} total
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
