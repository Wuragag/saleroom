"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  X,
  Send,
  Copy,
  Check,
  Loader2,
  Trash2,
  ExternalLink,
  Bell,
  Video,
  Mail,
  BadgeCheck,
  Forward,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/api-client";
import { normalizeDomains, EMAIL_RE } from "@/lib/page-gate";
import type { PageContactRow } from "@/types";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageId: string;
  slug: string;
  pageTitle: string;
  /** The editor header also toggles the gate — keep both in sync. */
  onRequireEmailChange?: (requireEmail: boolean) => void;
}

function SettingToggle({
  checked,
  onToggle,
  icon: Icon,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 pt-3 border-t border-border shrink-0 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="h-3.5 w-3.5 rounded border-border accent-primary"
      />
      <Icon className="h-3 w-3 text-muted-foreground" />
      <span className="text-xs text-foreground">{label}</span>
    </label>
  );
}

interface ContactChip {
  email: string;
  name?: string;
}

export function ShareModal({
  open,
  onOpenChange,
  pageId,
  slug,
  pageTitle,
  onRequireEmailChange,
}: ShareModalProps) {
  const [chips, setChips] = useState<ContactChip[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [sending, setSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // Sentinel id for the page-link row so it shares the contact-row copy state.
  const PAGE_LINK_ID = "page-link";
  // Resolved after mount from the real origin — the displayed URL and the
  // copied URL must never disagree (no hardcoded domain).
  const [publicLink, setPublicLink] = useState(`/p/${slug}`);
  const [contacts, setContacts] = useState<PageContactRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [notifyOnView, setNotifyOnView] = useState<boolean | null>(null);
  const [recordingEnabled, setRecordingEnabled] = useState<boolean | null>(null);
  // Access settings — who has to identify themselves, and how.
  const [requireEmail, setRequireEmail] = useState<boolean | null>(null);
  const [verifyEmail, setVerifyEmail] = useState(false);
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [domainInput, setDomainInput] = useState("");
  const [savingDomains, setSavingDomains] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear copy timer on unmount
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setPublicLink(`${window.location.origin}/p/${slug}`);
  }, [slug]);

  const flashCopied = (id: string) => {
    setCopiedId(id);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopiedId(null), 1500);
  };

  const copyPageLink = async () => {
    try {
      await navigator.clipboard.writeText(publicLink);
      flashCopied(PAGE_LINK_ID);
    } catch {
      toast.error("Failed to copy link to clipboard");
    }
  };

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
      // Load the current notification, recording and access settings
      apiClient
        .get<{
          notifyOnView?: boolean;
          recordingEnabled?: boolean;
          requireEmail?: boolean;
          verifyEmail?: boolean;
          allowedDomains?: string[];
        }>(`/api/pages/${pageId}`)
        .then((p) => {
          setNotifyOnView(!!p.notifyOnView);
          setRecordingEnabled(!!p.recordingEnabled);
          setRequireEmail(!!p.requireEmail);
          setVerifyEmail(!!p.verifyEmail);
          setAllowedDomains(Array.isArray(p.allowedDomains) ? p.allowedDomains : []);
        })
        .catch(() => {
          setNotifyOnView(null);
          setRecordingEnabled(null);
          setRequireEmail(null);
        });
    }
  }, [open, fetchContacts, pageId]);

  // Optimistic per-page boolean setting update with rollback on failure.
  // Resolves to whether the save stuck, so callers can sync other state.
  const updateSetting = async (
    field: "notifyOnView" | "recordingEnabled" | "requireEmail" | "verifyEmail",
    next: boolean,
    setter: (v: boolean) => void,
    labels: { on: string; off: string; error: string }
  ): Promise<boolean> => {
    setter(next); // optimistic
    try {
      await apiClient.put(`/api/pages/${pageId}`, { [field]: next });
      toast.success(next ? labels.on : labels.off);
      return true;
    } catch {
      setter(!next); // rollback
      toast.error(labels.error);
      return false;
    }
  };

  const saveDomains = async (next: string[]) => {
    const prev = allowedDomains;
    setAllowedDomains(next); // optimistic
    setSavingDomains(true);
    try {
      const saved = await apiClient.put<{ allowedDomains?: string[] }>(`/api/pages/${pageId}`, {
        allowedDomains: next,
      });
      if (Array.isArray(saved.allowedDomains)) setAllowedDomains(saved.allowedDomains);
    } catch {
      setAllowedDomains(prev);
      toast.error("Failed to update allowed domains");
    } finally {
      setSavingDomains(false);
    }
  };

  const addDomains = () => {
    const parsed = normalizeDomains(domainInput);
    if (parsed.length === 0) {
      if (domainInput.trim()) toast.error("Enter a domain like acme.com");
      return;
    }
    const merged = normalizeDomains([...allowedDomains, ...parsed]);
    setDomainInput("");
    if (merged.length !== allowedDomains.length) void saveDomains(merged);
  };

  const removeDomain = (d: string) => {
    void saveDomains(allowedDomains.filter((x) => x !== d));
  };

  const addChip = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email)) return;
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
    try {
      await navigator.clipboard.writeText(`${publicLink}?ref=${refToken}`);
      flashCopied(contactId);
    } catch {
      toast.error("Failed to copy link to clipboard");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-title">
            Share this page
          </DialogTitle>
          <p className="text-small text-muted-foreground">
            Send a private, trackable link to each buyer of &ldquo;{pageTitle}
            &rdquo;.
          </p>
        </DialogHeader>

        {/* Public link row — shows exactly what Copy puts on the clipboard */}
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
          <span className="truncate text-small text-muted-foreground">
            {publicLink.replace(/^https?:\/\//, "")}
          </span>
          <Button
            size="sm"
            variant={copiedId === PAGE_LINK_ID ? "secondary" : "outline"}
            className="ml-auto shrink-0"
            onClick={copyPageLink}
          >
            {copiedId === PAGE_LINK_ID ? (
              <Check className="h-3.5 w-3.5 text-success" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copiedId === PAGE_LINK_ID ? "Copied" : "Copy"}
          </Button>
        </div>

        <div className="flex flex-col gap-4 py-2 overflow-y-auto flex-1 min-h-0">
          {/* Email + Name inputs */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-small font-medium text-foreground">Invite by email</label>
              <div className="flex flex-wrap gap-1.5 px-3 py-2 rounded-lg border-[1.5px] border-border-strong bg-card min-h-[40px] transition-colors focus-within:border-foreground focus-within:shadow-ring-soft">
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
                    <Avatar name={c.name || c.email} size="sm" className="h-6 w-6 text-3xs" />
                    <div className="flex-1 min-w-0">
                      <p className="text-small font-medium text-foreground truncate flex items-center gap-1">
                        <span className="truncate">{c.name || c.email}</span>
                        {c.verified && (
                          <BadgeCheck
                            className="h-3.5 w-3.5 shrink-0 text-success"
                            aria-label="Email verified"
                          />
                        )}
                      </p>
                      {(c.name || c.forwardedFrom || c.source === "GATE") && (
                        <p className="text-3xs text-muted-foreground truncate flex items-center gap-1">
                          {c.name && <span className="truncate">{c.email}</span>}
                          {c.forwardedFrom ? (
                            <span className="inline-flex items-center gap-0.5 text-info shrink-0">
                              <Forward className="h-3 w-3" aria-hidden="true" />
                              via {c.forwardedFrom.name || c.forwardedFrom.email}
                            </span>
                          ) : c.source === "GATE" ? (
                            <span className="shrink-0">· self-identified</span>
                          ) : null}
                        </p>
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

        {/* Access — who has to identify themselves, and how */}
        {requireEmail !== null && (
          <>
            <SettingToggle
              checked={requireEmail}
              icon={Mail}
              label="Require email to view"
              onToggle={async () => {
                const next = !requireEmail;
                const saved = await updateSetting("requireEmail", next, setRequireEmail, {
                  on: "Email gate enabled",
                  off: "Email gate disabled",
                  error: "Failed to update email gate setting",
                });
                // Only tell the editor header once the save actually stuck.
                if (saved) onRequireEmailChange?.(next);
              }}
            />
            {requireEmail && (
              <div className="ml-5 mt-2 flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={verifyEmail}
                    onChange={() =>
                      updateSetting("verifyEmail", !verifyEmail, setVerifyEmail, {
                        on: "Visitors must verify their email",
                        off: "Email verification off",
                        error: "Failed to update verification setting",
                      })
                    }
                    className="h-3.5 w-3.5 rounded border-border accent-primary"
                  />
                  <BadgeCheck className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-foreground">Verify with a magic link</span>
                  <span className="text-3xs text-muted-foreground">— proves it&apos;s really them</span>
                </label>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                    <Input
                      value={domainInput}
                      onChange={(e) => setDomainInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          addDomains();
                        }
                      }}
                      onBlur={addDomains}
                      placeholder={
                        allowedDomains.length === 0
                          ? "Only allow domains, e.g. acme.com (optional)"
                          : "Add another domain"
                      }
                      aria-label="Allowed email domains"
                      disabled={savingDomains}
                      className="h-7 text-xs"
                    />
                  </div>
                  {allowedDomains.length > 0 && (
                    <div className="flex flex-wrap gap-1 pl-5">
                      {allowedDomains.map((d) => (
                        <Badge
                          key={d}
                          variant="neutral"
                          className="gap-1 rounded-full text-3xs font-medium px-2 py-0.5"
                        >
                          @{d}
                          <button
                            type="button"
                            onClick={() => removeDomain(d)}
                            className="hover:text-destructive"
                            aria-label={`Remove ${d}`}
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* View notification toggle */}
        {notifyOnView !== null && (
          <SettingToggle
            checked={notifyOnView}
            icon={Bell}
            label="Email me when someone views this page"
            onToggle={() =>
              updateSetting("notifyOnView", !notifyOnView, setNotifyOnView, {
                on: "View notifications on",
                off: "View notifications off",
                error: "Failed to update notification setting",
              })
            }
          />
        )}

        {/* Session replay toggle */}
        {recordingEnabled !== null && (
          <SettingToggle
            checked={recordingEnabled}
            icon={Video}
            label="Record visitor sessions for replay"
            onToggle={() =>
              updateSetting("recordingEnabled", !recordingEnabled, setRecordingEnabled, {
                on: "Session replay on",
                off: "Session replay off",
                error: "Failed to update session replay setting",
              })
            }
          />
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
