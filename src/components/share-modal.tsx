"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, Send, Copy, Check, Loader2, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
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
  const [copied, setCopied] = useState(false);
  const [contacts, setContacts] = useState<PageContactRow[]>([]);
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pages/${pageId}/contacts`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [pageId]);

  useEffect(() => {
    if (open) {
      fetchContacts();
      setChips([]);
      setEmailInput("");
      setNameInput("");
    }
  }, [open, fetchContacts]);

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
      const res = await fetch(`/api/pages/${pageId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contacts: chips.map((c) => ({ email: c.email, name: c.name })),
          sendEmail,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      if (sendEmail) {
        toast.success(`Sent to ${data.contacts.length} contact(s)`);
      } else {
        // Copy all links to clipboard
        const links = data.contacts.map((c: { link: string }) => c.link).join("\n");
        await navigator.clipboard.writeText(links);
        toast.success("Links copied to clipboard");
      }

      setChips([]);
      fetchContacts();
    } catch {
      toast.error("Failed to create contacts");
    }
    setSending(false);
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      await fetch(`/api/pages/${pageId}/contacts/${contactId}`, { method: "DELETE" });
      setContacts(contacts.filter((c) => c.id !== contactId));
      toast.success("Contact removed");
    } catch {
      toast.error("Failed to remove contact");
    }
  };

  const copyContactLink = async (refToken: string) => {
    const link = `${window.location.origin}/p/${slug}?ref=${refToken}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
                    <button onClick={() => removeChip(c.email)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
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
                        <p className="text-[10px] text-muted-foreground truncate">{c.email}</p>
                      )}
                    </div>
                    {/* Engagement */}
                    {c.totalSessions > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {c.totalSessions} visit{c.totalSessions !== 1 ? "s" : ""}
                      </span>
                    )}
                    {c.intent && (
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          c.intent === "High Intent"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : c.intent === "Warm"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {c.intent}
                      </span>
                    )}
                    {/* Actions */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => copyContactLink(c.refToken)}
                        className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted"
                        title="Copy link"
                      >
                        {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      </button>
                      <a
                        href={`/p/${slug}?ref=${c.refToken}`}
                        target="_blank"
                        className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted"
                        title="Open link"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <button
                        onClick={() => handleDeleteContact(c.id)}
                        className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-destructive"
                        title="Remove"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
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
            className="flex-1 rounded-lg gap-1.5"
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
