"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, ChevronLeft, ChevronRight, Shield, ShieldOff, UserCheck, KeyRound } from "lucide-react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/api-client";

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
  const [resettingId, setResettingId] = useState<string | null>(null);
  // Confirmation state for high-power actions (impersonate / grant-revoke admin)
  const [pendingAction, setPendingAction] = useState<
    { kind: "admin" | "impersonate"; user: UserRow } | null
  >(null);
  // Reset-password modal state (replaces window.prompt)
  const [resetUser, setResetUser] = useState<UserRow | null>(null);
  const [resetPwd, setResetPwd] = useState("");
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
      const data = await apiClient.get<{ users: UserRow[]; total: number }>(`/api/admin/users?${params}`);
      setUsers(data.users ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load users");
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
      await apiClient.put(`/api/admin/users/${user.id}`, { isAdmin: !user.isAdmin });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isAdmin: !user.isAdmin } : u))
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update admin status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleImpersonate = async (user: UserRow) => {
    setImpersonatingId(user.id);
    try {
      const { token } = await apiClient.post<{ token: string }>(`/api/admin/impersonate/${user.id}`);
      await signIn("credentials", { impersonateToken: token, callbackUrl: "/" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to start impersonation");
    } finally {
      setImpersonatingId(null);
    }
  };

  const handleResetPassword = async () => {
    if (!resetUser) return;
    if (resetPwd.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    const user = resetUser;
    setResettingId(user.id);
    try {
      await apiClient.post(`/api/admin/users/${user.id}/reset-password`, { password: resetPwd });
      toast.success(`Password reset for ${user.email}`);
      setResetUser(null);
      setResetPwd("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to reset password");
    } finally {
      setResettingId(null);
    }
  };

  // Runs the confirmed high-power action, then closes the dialog.
  const runPendingAction = async () => {
    if (!pendingAction) return;
    const { kind, user } = pendingAction;
    setPendingAction(null);
    if (kind === "admin") await handleToggleAdmin(user);
    else await handleImpersonate(user);
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
                      onClick={() => setPendingAction({ kind: "admin", user })}
                      disabled={togglingId === user.id}
                      title={user.isAdmin ? "Remove admin" : "Make admin"}
                      className="flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-50 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => { setResetUser(user); setResetPwd(""); }}
                        disabled={resettingId === user.id}
                        title="Reset password"
                        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {resettingId === user.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <KeyRound className="h-3.5 w-3.5" />
                        )}
                        <span>Reset pwd</span>
                      </button>
                      <button
                        onClick={() => setPendingAction({ kind: "impersonate", user })}
                        disabled={impersonatingId === user.id}
                        title="Log in as this user"
                        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {impersonatingId === user.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UserCheck className="h-3.5 w-3.5" />
                        )}
                        <span>Login as</span>
                      </button>
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

      {/* Confirm high-power actions (grant/revoke admin, impersonate) */}
      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(open) => { if (!open) setPendingAction(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.kind === "impersonate"
                ? `Log in as ${pendingAction.user.name ?? pendingAction.user.email}?`
                : pendingAction?.user.isAdmin
                  ? `Remove admin from ${pendingAction?.user.name ?? pendingAction?.user.email}?`
                  : `Make ${pendingAction?.user.name ?? pendingAction?.user.email} an admin?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.kind === "impersonate"
                ? "You'll be signed in as this user and see the app exactly as they do until you stop impersonating."
                : pendingAction?.user.isAdmin
                  ? "They will lose access to the admin console and all admin actions."
                  : "They will gain full admin access — including impersonation, password resets, and billing overrides for every team."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={runPendingAction}>
              {pendingAction?.kind === "impersonate"
                ? "Log in as user"
                : pendingAction?.user.isAdmin
                  ? "Remove admin"
                  : "Grant admin"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset password (styled — replaces window.prompt) */}
      <Dialog
        open={resetUser !== null}
        onOpenChange={(open) => { if (!open) { setResetUser(null); setResetPwd(""); } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{resetUser?.email}</strong>. They&apos;ll need to use it on their next sign-in.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); handleResetPassword(); }}
            className="space-y-3"
          >
            <label htmlFor="admin-reset-pwd" className="text-sm font-medium text-foreground">
              New password
            </label>
            <Input
              id="admin-reset-pwd"
              type="password"
              value={resetPwd}
              onChange={(e) => setResetPwd(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              autoFocus
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setResetUser(null); setResetPwd(""); }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={resetPwd.length < 8 || resettingId === resetUser?.id}>
                {resettingId === resetUser?.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Reset password"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
