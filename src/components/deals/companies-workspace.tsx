"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, Plus, Search, Trash2 } from "lucide-react";

import { apiClient, ApiError } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import { formatDealValue } from "@/lib/deals";
import { formatRelativeTime } from "@/lib/format-utils";
import { DealsTabs } from "@/components/deals/deals-tabs";
import type { CompanyRow, IntentLabel } from "@/types";

const INTENT_VARIANT: Record<IntentLabel, "success" | "warning" | "neutral"> = {
  "High Intent": "success",
  Warm: "warning",
  Cold: "neutral",
};

const GRID =
  "grid grid-cols-[minmax(0,1.6fr)_90px_90px_110px_170px_40px] items-center gap-3";

function CompanyDialog({
  company,
  onClose,
  onSaved,
}: {
  /** Null = create mode. */
  company: CompanyRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(company?.name ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      if (company) {
        await apiClient.patch(`/api/deals/companies/${company.id}`, { name: name.trim() });
      } else {
        await apiClient.post("/api/deals/companies", { name: name.trim() });
      }
      toast.success(company ? "Company updated" : "Company added");
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error("A company with that name already exists");
      } else {
        toast.error(err instanceof ApiError ? err.message : "Failed to save company");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{company ? "Edit company" : "Add company"}</DialogTitle>
          <DialogDescription>
            Companies group deals and contacts. New names are created
            automatically when you type them on a deal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="company-name" className="text-xs font-medium text-foreground">
              Name
            </label>
            <Input
              id="company-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Inc."
              autoFocus
              required
            />
          </div>

          {company && company.deals.length > 0 && (
            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-foreground">Deals</span>
              <div className="flex flex-wrap gap-1.5">
                {company.deals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    className="rounded-full border border-border bg-background px-2 py-0.5 text-2xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                  >
                    {deal.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {company && company.contacts.length > 0 && (
            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-foreground">Contacts</span>
              <p className="text-2xs text-muted-foreground">
                {company.contacts.map((c) => c.name || c.email).join(", ")}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || saving}>
              {saving ? "Saving…" : company ? "Save" : "Add company"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CompaniesWorkspace({ companies }: { companies: CompanyRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<CompanyRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<CompanyRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => c.name.toLowerCase().includes(q));
  }, [companies, search]);

  const totalOpen = companies.reduce((sum, c) => sum + c.openValue, 0);

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await apiClient.delete(`/api/deals/companies/${deleting.id}`);
      toast.success("Company removed");
      setDeleting(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to remove company");
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Deals"
        description="The people and companies behind your deals, and how they engage."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus />
            Add company
          </Button>
        }
      />
      <DealsTabs />

      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {companies.length} compan{companies.length === 1 ? "y" : "ies"} ·{" "}
          <span className="font-semibold tabular-nums text-foreground">
            {formatDealValue(totalOpen)}
          </span>{" "}
          open
        </p>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies…"
            className="h-8 w-48 rounded-full border border-border bg-card pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="mt-4">
        {companies.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No companies yet"
            description="Companies appear when you name one on a deal — or add one here."
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus />
                Add company
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Search} title="No companies match" description="Try a different search." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <div className="min-w-[780px]">
              <div
                className={cn(
                  GRID,
                  "border-b border-border bg-muted/30 px-4 py-2 text-2xs font-semibold uppercase tracking-wide text-muted-foreground"
                )}
              >
                <span>Company</span>
                <span>Contacts</span>
                <span>Open</span>
                <span>Open value</span>
                <span>Buyer activity</span>
                <span className="sr-only">Actions</span>
              </div>
              <div className="divide-y divide-border">
                {filtered.map((company) => (
                  <div
                    key={company.id}
                    onClick={() => setEditing(company)}
                    className={cn(GRID, "cursor-pointer px-4 py-3 transition-colors hover:bg-muted/40")}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate text-sm font-medium text-foreground">
                        {company.name}
                      </span>
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {company.contactCount || "—"}
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {company.openDealCount || "—"}
                    </span>
                    <span className="text-sm tabular-nums text-foreground">
                      {company.openValue > 0 ? formatDealValue(company.openValue) : "—"}
                    </span>
                    <span>
                      {company.engagement.intent ? (
                        <span className="flex items-center gap-1.5">
                          <Badge variant={INTENT_VARIANT[company.engagement.intent]}>
                            {company.engagement.intent}
                          </Badge>
                          {company.engagement.lastActivityAt && (
                            <span className="text-2xs text-muted-foreground whitespace-nowrap">
                              {formatRelativeTime(company.engagement.lastActivityAt)}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-2xs text-muted-foreground">No activity yet</span>
                      )}
                    </span>
                    <span onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        aria-label={`Remove ${company.name}`}
                        size="sm"
                        onClick={() => setDeleting(company)}
                      >
                        <Trash2 />
                      </IconButton>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {(creating || editing) && (
        <CompanyDialog
          company={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => router.refresh()}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove &ldquo;{deleting?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && (deleting.deals.length > 0 || deleting.contactCount > 0)
                ? `Its ${deleting.deals.length} deal${deleting.deals.length === 1 ? "" : "s"} and ${deleting.contactCount} contact${deleting.contactCount === 1 ? "" : "s"} are kept — they just lose the company link.`
                : "This company isn't linked to any deals or contacts."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleteBusy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteBusy ? "Removing…" : "Remove company"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
