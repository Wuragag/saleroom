"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Download, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { apiClient, ApiError } from "@/lib/api-client";
import { DELETE_CONFIRMATION } from "@/lib/account-deletion";

/**
 * Settings → Account: the two data-subject rights every privacy law gives an
 * account holder — a copy of their data (portability) and erasure.
 */
export function AccountDangerZone() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmation.trim() === DELETE_CONFIRMATION && password.length > 0 && !deleting;

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await apiClient.delete("/api/account", { password, confirmation });
      toast.success("Your account and data have been deleted.");
      await signOut({ redirect: false });
      router.replace("/?deleted=1");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <>
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-foreground mb-1">Your data</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Download a copy of everything in your account — profile, pages, contacts, action plans, deals and comments — as JSON.
        </p>
        <Button asChild variant="outline" size="sm">
          <a href="/api/account/export" download>
            <Download className="h-4 w-4" />
            Download my data
          </a>
        </Button>
      </Card>

      <Card className="p-6 border-destructive/30">
        <h3 className="text-sm font-semibold text-foreground mb-1">Delete account</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently deletes your account, every page you created and everything collected on those pages (buyer
          activity, recordings, contacts, form submissions), your deals and comments. Workspaces where you are the only
          member are deleted too and any subscription on them is cancelled. This cannot be undone.
        </p>
        <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
          <Trash2 className="h-4 w-4" />
          Delete my account
        </Button>
      </Card>

      <AlertDialog open={open} onOpenChange={(o) => { if (!deleting) { setOpen(o); setError(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This erases your account and all of its data immediately. If you own a workspace that still has other
              members, transfer ownership first. Type {DELETE_CONFIRMATION} and enter your password to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            {error && (
              <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="delete-confirm">
                Type {DELETE_CONFIRMATION}
              </label>
              <Input id="delete-confirm" autoComplete="off" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder={DELETE_CONFIRMATION} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="delete-password">
                Your password
              </label>
              <Input id="delete-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!canDelete}
              onClick={(e) => { e.preventDefault(); void handleDelete(); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
