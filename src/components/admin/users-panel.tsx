"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, ChevronLeft, ChevronRight, Shield, ShieldOff, UserCheck } from "lucide-react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  role: string | null;
  team: {
    id: string;
    name: string;
    plan: string;
    status: string;
  } | null;
}

const PLAN_COLORS: Record<string, string> = {
  TEAM: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  PRO: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  FREE: "bg-muted text-muted-foreground",
};

export function UsersPanel() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
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

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleAdmin = async (user: UserRow) => {
    setTogglingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: !user.isAdmin }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isAdmin: !user.isAdmin } : u))
        );
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Failed to update admin status");
      }
    } finally {
      setTogglingId(null);
    }
  };

  const handleImpersonate = async (user: UserRow) => {
    setImpersonatingId(user.id);
    try {
      const res = await fetch(`/api/admin/impersonate/${user.id}`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to start impersonation");
        return;
      }
      const { token } = await res.json();
      await signIn("credentials", { impersonateToken: token, callbackUrl: "/" });
    } finally {
      setImpersonatingId(null);
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
        placeholder="Search by name or email…"
        className="w-full max-w-sm px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
      />

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Team</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Admin</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-muted-foreground">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {user.name ?? <span className="text-muted-foreground italic">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.team?.name ?? <span className="italic">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${
                        PLAN_COLORS[user.team?.plan ?? "FREE"]
                      }`}
                    >
                      {user.team?.plan ?? "FREE"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">
                    {user.role?.toLowerCase() ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleAdmin(user)}
                      disabled={togglingId === user.id}
                      title={user.isAdmin ? "Remove admin" : "Make admin"}
                      className="flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {togglingId === user.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : user.isAdmin ? (
                        <>
                          <Shield className="h-3.5 w-3.5 text-primary" />
                          <span className="text-primary">Admin</span>
                        </>
                      ) : (
                        <>
                          <ShieldOff className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">—</span>
                        </>
                      )}
                    </button>
                  </td>
                  {/* Impersonate */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleImpersonate(user)}
                      disabled={impersonatingId === user.id}
                      title="Log in as this user"
                      className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    >
                      {impersonatingId === user.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UserCheck className="h-3.5 w-3.5" />
                      )}
                      <span>Login as</span>
                    </button>
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
            {total} user{total !== 1 ? "s" : ""} total
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
