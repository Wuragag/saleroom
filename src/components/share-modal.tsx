"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, Send, Copy, Check, Loader2, Trash2, ExternalLink, Bell } from "lucide-react";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/api-client";
import type { PageContactRow } from "@/types";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageId: string;
  slug: string;
  pageTitle: string;
}

interface ContactChip {
  email: string;
  name?: string;
}

export function ShareModal({ open, onOpenChange, pageId, slug, pageTitle }: ShareModalProps) {
  const [chips, setChips] = useState<ContactChip[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [sending, setSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<PageContactRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [notifyOnView, setNotifyOnView] = useState<boolean | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear copy timer on unmount
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<{ contacts: PageContactRow[] }>(`/api/pages/${pageId}/contacts`);
      setContacts(data.contacts);
    } catch { /* silent */ }
    setLoading(false);
  }, [pageId]);

  useEffect(() => {
    if (open) {
      fetchContacts();
      setChips([]);
      setEmailInput("");
      setNameInput("");
      // Load the current notification setting
      apiClient
        .get<{ notifyOnView?: boolean }>(`/api/pages/${pageId}`)
        .then((p) => setNotifyOnView(!!p.notifyOnView))
        .catch(() => setNotifyOnView(null));
    }
  }, [open, fetchContacts, pageId]);

  const handleNotifyToggle = async () => {
    if (notifyOnView === null) return;
    const next = !notifyOnView;
    setNotifyOnView(next); // optimistic
    try {
      await apiClient.put(`/api/pages/${pageId}`, { notifyOnView: next });
      toast.success(next ? "View notifications on" : "View notifications off");
    } catch {
      setNotifyOnView(!next);
      toast.error("Failed to update notification setting");
    }
  };

  const addChip = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    if (chips.some((c) => c.email === email)) return;
    setChips([...chips, { email, name: nameInput.trim() || undefined }]);
    setEmailInput("");
    setNameInput("");
    emailRef.current?.focus();
  };

  const removeChip = (email: string) => {
    setChips(chips.filter((c) => c.email !== email));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addChip();
    }
  };

  const handleSend = async (sendEmail: boolean) => {
    if (chips.length === 0) return;
    setSending(true);
    try {
      const data = await apiClient.post<{ contacts: { link: string }[] }>(`/api/pages/${pageId}/contacts`, {
        contacts: chips.map((c) => ({ email: c.email, name: c.name })),
        sendEmail,
      });

      if (sendEmail) {
        toast.success(`Sent to ${data.contacts.length} contact(s)`);
      } else {
        // Copy all links to clipboard
        const links = data.contacts.map((c) => c.link).join("\n");
        try {
          await navigator.clipboard.writeText(links);
          toast.success("Links copied to clipboard");
        } catch {
          toast.error("Failed to copy links to clipboard");
        }
      }

      setChips([]);
      fetchContacts();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create contacts");
    }
    setSending(false);
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      await apiClient.delete(`/api/pages/${pageId}/contacts/${contactId}`);
      setContacts(contacts.filter((c) => c.id !== contactId));
      toast.success("Contact removed");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to remove contact");
    }
  };

  const copyContactLink = async (contactId: string, refToken: string) => {
    const link = `${window.location.origin}/p/${slug}?ref=${refToken}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(contactId);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedId(null), 1500);
    } catch {
      toast.error("Failed to copy link to clipboard");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Share &ldquo;{pageTitle}&rdquo;</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2 overflow-y-auto flex-1 min-h-0">
          {/* Email + Name inputs */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground">Email</label>
              <div className="flex flex-wrap gap-1.5 px-3 py-2 rounded-md border border-border bg-white shadow-sm min-h-[38px] transition-colors focus-within:border-ring">
                {chips.map((c) => (
                  <span
                    key={c.email}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md bg-primary/10 text-primary"
                  >
                    {c.name ? `${c.name} <${c.email}>` : c.email}
                    <IconButton
                      size="sm"
                      aria-label={`Remove ${c.email}`}
                      onClick={() => removeChip(c.email)}
                      className="h-4 w-4 rounded-sm hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </IconButton>
                  </span>
                ))}
                <input
                  ref={emailRef}
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={addChip}
                  placeholder={chips.length === 0 ? "Enter email addresses..." : ""}
                  className="flex-1 min-w-[180px] text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Name <span className="font-normal">(optional)</span>
              </label>
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Contact name"
                className="text-sm bg-white border-border"
              />
            </div>
          </div>

          {/* Existing contacts */}
          {contacts.length > 0 && (
            <div className="flex flex-col gap-2 pt-2 border-t border-border">
              <h4 className="text-xs font-semibold text-foreground">
                Shared with ({contacts.length})
              </h4>
              <div className="flex flex-col gap-1">
                {contacts.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/50 group"
                  >
                    {/* Avatar */}
                    <div
                      className="h-6 w-6 rounded-full flex items-center justify-center text-white shrink-0"
                      style={{
                        backgroundColor: `hsl(${c.email.length * 37 % 360}, 60%, 50%)`,
                        fontSize: "9px",
                        fontWeight: 700,
                      }}
                    >
                      {(c.name || c.email)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {c.name || c.email}
                      </p>
                      {c.name && (
                        <p className="text-3xs text-muted-foreground truncate">{c.email}</p>
                      )}
                    </div>
                    {/* Engagement */}
                    {c.totalSessions > 0 && (
                      <span className="text-3xs text-muted-foreground">
                        {c.totalSessions} visit{c.totalSessions !== 1 ? "s" : ""}
                      </span>
                    )}
                    {c.intent && (
                      <Badge
                        variant={
                          c.intent === "High Intent"
                            ? "success"
                            : c.intent === "Warm"
                            ? "warning"
                            : "neutral"
                        }
                        className="text-3xs font-medium px-1.5 py-0.5 rounded-full"
                      >
                        {c.intent}
                      </Badge>
                    )}
                    {/* Actions */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <IconButton
                        size="sm"
                        aria-label="Copy link"
                        onClick={() => copyContactLink(c.id, c.refToken)}
                        className={`h-6 w-6 rounded-md ${copiedId === c.id ? "bg-success-subtle hover:bg-success-subtle" : ""}`}
                        title="Copy link"
                      >
                        {copiedId === c.id ? <Check className="h-3 w-3 text-success animate-dopamine-bounce" /> : <Copy className="h-3 w-3" />}
                      </IconButton>
                      <a
                        href={`/p/${slug}?ref=${c.refToken}`}
                        target="_blank"
                        className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted"
                        title="Open link"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <IconButton
                        size="sm"
                        aria-label="Remove contact"
                        onClick={() => handleDeleteContact(c.id)}
                        className="h-6 w-6 rounded-md text-muted-foreground hover:text-destructive"
                        title="Remove"
                      >
                        <Trash2 className="h-3 w-3" />
                      </IconButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading && contacts.length === 0 && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* View notification toggle */}
        {notifyOnView !== null && (
          <label className="flex items-center gap-2 pt-3 border-t border-border shrink-0 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={notifyOnView}
              onChange={handleNotifyToggle}
              className="h-3.5 w-3.5 rounded border-border accent-primary"
            />
            <Bell className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-foreground">
              Email me when someone views this page
            </span>
          </label>
        )}

        {/* Action buttons — always visible at bottom */}
        <div className="flex gap-2 pt-3 border-t border-border shrink-0">
          <Button
            size="sm"
            className="flex-1 rounded-lg gap-1.5"
            onClick={() => handleSend(true)}
            disabled={sending || chips.length === 0}
          >
            {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            Send & Copy Links
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg gap-1.5"
            onClick={() => handleSend(false)}
            disabled={sending || chips.length === 0}
          >
            <Copy className="h-3 w-3" />
            Copy Links Only
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
