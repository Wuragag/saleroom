"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, Plus, Search, Trash2, Users } from "lucide-react";

import { apiClient, ApiError } from "@/lib/api-client";
import { Avatar } from "@/components/ui/avatar";
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
import { formatRelativeTime } from "@/lib/format-utils";
import { DealsTabs } from "@/components/deals/deals-tabs";
import type { ContactRow, IntentLabel } from "@/types";

const INTENT_VARIANT: Record<IntentLabel, "success" | "warning" | "neutral"> = {
  "High Intent": "success",
  Warm: "warning",
  Cold: "neutral",
};

const GRID =
  "grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_70px_170px_40px] items-center gap-3";

interface ContactsWorkspaceProps {
  contacts: ContactRow[];
  companies: { id: string; name: string }[];
}

function ContactDialog({
  contact,
  companies,
  onClose,
  onSaved,
}: {
  /** Null = create mode. */
  contact: ContactRow | null;
  companies: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(contact?.name ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [title, setTitle] = useState(contact?.title ?? "");
  const [companyName, setCompanyName] = useState(contact?.company?.name ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || saving) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        title: title.trim(),
        // A typed name creates or joins the company server-side.
        companyName: companyName.trim(),
      };
      if (contact) {
        await apiClient.patch(`/api/deals/contacts/${contact.id}`, payload);
      } else {
        await apiClient.post("/api/deals/contacts", payload);
      }
      toast.success(contact ? "Contact updated" : "Contact added");
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error("A contact with that email already exists");
      } else {
        toast.error(err instanceof ApiError ? err.message : "Failed to save contact");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{contact ? "Edit contact" : "Add contact"}</DialogTitle>
          <DialogDescription>
            {contact
              ? "Buyer-side details. Engagement is matched by email across your rooms."
              : "Contacts also appear here automatically when you share a room or add a stakeholder."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="contact-name" className="text-xs font-medium text-foreground">
                Name
              </label>
              <Input
                id="contact-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="contact-title" className="text-xs font-medium text-foreground">
                Role or title
              </label>
              <Input
                id="contact-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="CFO"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="contact-email" className="text-xs font-medium text-foreground">
              Email
            </label>
            <Input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@acme.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="contact-company" className="text-xs font-medium text-foreground">
              Company
            </label>
            <Input
              id="contact-company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Inc."
              list="contact-company-options"
            />
            <datalist id="contact-company-options">
              {companies.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>

          {contact && contact.dealCount > 0 && (
            <p className="text-2xs text-muted-foreground">
              On {contact.dealCount} deal{contact.dealCount === 1 ? "" : "s"}
              {contact.lastSeenAt
                ? ` · last active ${formatRelativeTime(contact.lastSeenAt)}`
                : ""}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!email.trim() || saving}>
              {saving ? "Saving…" : contact ? "Save" : "Add contact"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ContactsWorkspace({ contacts, companies }: ContactsWorkspaceProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ContactRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<ContactRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = q
      ? contacts.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            (c.company?.name ?? "").toLowerCase().includes(q)
        )
      : contacts;
    // Most recently active first; never-active rows sink to the bottom.
    return [...rows].sort((a, b) => (b.lastSeenAt ?? "").localeCompare(a.lastSeenAt ?? ""));
  }, [contacts, search]);

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await apiClient.delete(`/api/deals/contacts/${deleting.id}`);
      toast.success("Contact removed");
      setDeleting(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to remove contact");
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
            Add contact
          </Button>
        }
      />
      <DealsTabs />

      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {contacts.length} contact{contacts.length === 1 ? "" : "s"} — added
          automatically when you share a room or add a stakeholder.
        </p>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts…"
            className="h-8 w-48 rounded-full border border-border bg-card pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="mt-4">
        {contacts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No contacts yet"
            description="Share a room with someone, add a stakeholder to a deal, or add a contact by hand — they all land here."
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus />
                Add contact
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Search} title="No contacts match" description="Try a different search." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <div className="min-w-[820px]">
              <div
                className={cn(
                  GRID,
                  "border-b border-border bg-muted/30 px-4 py-2 text-2xs font-semibold uppercase tracking-wide text-muted-foreground"
                )}
              >
                <span>Contact</span>
                <span>Role</span>
                <span>Company</span>
                <span>Deals</span>
                <span>Buyer activity</span>
                <span className="sr-only">Actions</span>
              </div>
              <div className="divide-y divide-border">
                {filtered.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => setEditing(contact)}
                    className={cn(GRID, "cursor-pointer px-4 py-3 transition-colors hover:bg-muted/40")}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Avatar name={contact.name || contact.email} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {contact.name || contact.email}
                        </span>
                        {contact.name && (
                          <span className="block truncate text-2xs text-muted-foreground">
                            {contact.email}
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {contact.title || "—"}
                    </span>
                    <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                      {contact.company ? (
                        <>
                          <Building2 className="h-3 w-3 shrink-0" />
                          <span className="truncate">{contact.company.name}</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {contact.dealCount || "—"}
                    </span>
                    <span>
                      {contact.intent ? (
                        <span className="flex items-center gap-1.5">
                          <Badge variant={INTENT_VARIANT[contact.intent]}>
                            {contact.intent}
                          </Badge>
                          {contact.lastSeenAt && (
                            <span className="text-2xs text-muted-foreground whitespace-nowrap">
                              {formatRelativeTime(contact.lastSeenAt)}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-2xs text-muted-foreground">Not visited</span>
                      )}
                    </span>
                    <span onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        aria-label={`Remove ${contact.name || contact.email}`}
                        size="sm"
                        onClick={() => setDeleting(contact)}
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
        <ContactDialog
          contact={editing}
          companies={companies}
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
            <AlertDialogTitle>
              Remove &ldquo;{deleting?.name || deleting?.email}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes them from your contact book. Their room activity and
              any deal stakeholder entries are kept — and sharing a room with
              them again will re-add them here.
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
              {deleteBusy ? "Removing…" : "Remove contact"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
