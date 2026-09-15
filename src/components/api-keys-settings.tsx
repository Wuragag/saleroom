"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, KeyRound, Copy, Check, Trash2, Plug, Sparkles, Unplug } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionLabel } from "@/components/ui/section-label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { apiClient, ApiError } from "@/lib/api-client";
import { APP_NAME } from "@/lib/constants";

interface ApiKeyRow {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  createdAt: string;
}

type CreatedKey = ApiKeyRow & { token: string };

interface ConnectedApp {
  clientId: string;
  name: string;
  clientUri: string;
  lastUsedAt: string | null;
  connectedAt: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <IconButton
      aria-label={label}
      variant="outline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error("Couldn't copy — select the text and copy it manually");
        }
      }}
    >
      {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
    </IconButton>
  );
}

function Snippet({ children }: { children: string }) {
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg border border-border bg-muted px-3 py-2.5 pr-12 text-xs leading-relaxed text-foreground">
        <code>{children}</code>
      </pre>
      <div className="absolute right-1.5 top-1.5">
        <CopyButton value={children} label="Copy snippet" />
      </div>
    </div>
  );
}

export function ApiKeysSettings() {
  const [keys, setKeys] = useState<ApiKeyRow[] | null>(null);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<CreatedKey | null>(null);
  const [revoking, setRevoking] = useState<ApiKeyRow | null>(null);
  const [revokeBusy, setRevokeBusy] = useState(false);
  const [apps, setApps] = useState<ConnectedApp[] | null>(null);
  const [disconnecting, setDisconnecting] = useState<ConnectedApp | null>(null);
  const [disconnectBusy, setDisconnectBusy] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const endpoint = `${origin}/api/mcp`;

  const load = useCallback(async () => {
    try {
      const data = await apiClient.get<{ keys: ApiKeyRow[] }>("/api/account/api-keys");
      setKeys(data.keys);
    } catch {
      setKeys([]);
      toast.error("Failed to load API keys");
    }
  }, []);

  const loadApps = useCallback(async () => {
    try {
      const data = await apiClient.get<{ apps: ConnectedApp[] }>("/api/account/connected-apps");
      setApps(data.apps);
    } catch {
      setApps([]);
    }
  }, []);

  useEffect(() => {
    load();
    loadApps();
  }, [load, loadApps]);

  async function handleDisconnect() {
    if (!disconnecting) return;
    setDisconnectBusy(true);
    try {
      await apiClient.delete(`/api/account/connected-apps/${disconnecting.clientId}`);
      toast.success(`Disconnected ${disconnecting.name}`);
      setDisconnecting(null);
      await loadApps();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to disconnect");
    } finally {
      setDisconnectBusy(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const key = await apiClient.post<CreatedKey>("/api/account/api-keys", {
        name: name.trim(),
      });
      setCreated(key);
      setName("");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create key");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke() {
    if (!revoking) return;
    setRevokeBusy(true);
    try {
      await apiClient.delete(`/api/account/api-keys/${revoking.id}`);
      toast.success(`Revoked "${revoking.name}"`);
      setRevoking(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to revoke key");
    } finally {
      setRevokeBusy(false);
    }
  }

  const tokenPlaceholder = created?.token ?? "dbk_YOUR_API_KEY";

  return (
    <div className="space-y-6">
      {/* MCP connection */}
      <Card className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ai-subtle text-ai-subtle-foreground">
            <Plug className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Use {APP_NAME} from Claude or ChatGPT
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {APP_NAME} is a Model Context Protocol server. Add it as a connector and
              your AI assistant can draft and publish pages, share tracked links, read
              buyer engagement and update your pipeline — always with your own
              permissions, and you approve the connection first.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-ai-subtle-foreground" />
              <span className="text-sm font-medium text-foreground">Hosted assistants (sign in, no keys)</span>
            </div>
            <ol className="list-decimal pl-5 space-y-1.5 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Claude</span> (claude.ai):
                Settings → Connectors → <em>Add custom connector</em>, paste the URL below,
                then click <em>Connect</em> and approve access.
              </li>
              <li>
                <span className="font-medium text-foreground">ChatGPT</span>: Settings →
                Connectors → <em>Advanced</em> → enable <em>Developer mode</em> → <em>Create</em>,
                paste the URL, choose OAuth, then approve access.
              </li>
            </ol>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground">
                {endpoint}
              </code>
              <CopyButton value={endpoint} label="Copy connector URL" />
            </div>
          </div>

          <div>
            <SectionLabel>Developer tools (API key)</SectionLabel>
            <div className="mt-1.5 flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg border border-border bg-muted px-3 py-2 text-xs text-foreground">
                {endpoint}
              </code>
              <CopyButton value={endpoint} label="Copy endpoint URL" />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Same endpoint. Clients without an OAuth flow (Claude Code, Cursor, Claude
              Desktop via mcp-remote) authenticate with an API key in the{" "}
              <code className="text-2xs">Authorization: Bearer</code> header.
            </p>
          </div>

          <div>
            <SectionLabel>Claude Code</SectionLabel>
            <div className="mt-1.5">
              <Snippet>{`claude mcp add --transport http ${APP_NAME.toLowerCase()} ${endpoint} \\
  --header "Authorization: Bearer ${tokenPlaceholder}"`}</Snippet>
            </div>
          </div>

          <div>
            <SectionLabel>Cursor / Windsurf / other JSON configs</SectionLabel>
            <div className="mt-1.5">
              <Snippet>{JSON.stringify(
                {
                  mcpServers: {
                    [APP_NAME.toLowerCase()]: {
                      url: endpoint,
                      headers: { Authorization: `Bearer ${tokenPlaceholder}` },
                    },
                  },
                },
                null,
                2
              )}</Snippet>
            </div>
          </div>

          <div>
            <SectionLabel>Claude Desktop (via mcp-remote)</SectionLabel>
            <div className="mt-1.5">
              <Snippet>{JSON.stringify(
                {
                  mcpServers: {
                    [APP_NAME.toLowerCase()]: {
                      command: "npx",
                      args: [
                        "-y",
                        "mcp-remote",
                        endpoint,
                        "--header",
                        `Authorization: Bearer ${tokenPlaceholder}`,
                      ],
                    },
                  },
                },
                null,
                2
              )}</Snippet>
            </div>
          </div>
        </div>
      </Card>

      {/* Connected apps (OAuth grants) */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-foreground mb-1">Connected apps</h3>
        <p className="text-sm text-muted-foreground mb-5">
          Assistants you&apos;ve approved through the sign-in flow. Disconnecting revokes
          their access immediately.
        </p>
        {apps === null ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : apps.length === 0 ? (
          <EmptyState
            icon={Unplug}
            title="Nothing connected yet"
            description="Add the connector URL above in Claude or ChatGPT and approve access."
            className="py-8"
          />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {apps.map((app) => (
              <li key={app.clientId} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{app.name}</div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Connected {formatDate(app.connectedAt)} · Last used {formatDate(app.lastUsedAt)}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setDisconnecting(app)}>
                  Disconnect
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* API keys */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-foreground mb-1">API keys</h3>
        <p className="text-sm text-muted-foreground mb-5">
          Keys act as you: anything you can see or edit, a key can too. Treat them
          like passwords and revoke any you no longer use.
        </p>

        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2 mb-6">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Key name, e.g. Claude Code on my laptop"
            maxLength={60}
            aria-label="New API key name"
            className="flex-1"
          />
          <Button type="submit" disabled={creating || !name.trim()}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Create key
          </Button>
        </form>

        {keys === null ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : keys.length === 0 ? (
          <EmptyState
            icon={KeyRound}
            title="No API keys yet"
            description="Create one to connect an MCP client. You'll see the key exactly once."
            className="py-10"
          />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {keys.map((key) => (
              <li key={key.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {key.name}
                    </span>
                    <Badge variant="neutral">
                      <code className="text-2xs">{key.prefix}…</code>
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Created {formatDate(key.createdAt)} · Last used {formatDate(key.lastUsedAt)}
                  </p>
                </div>
                <IconButton
                  aria-label={`Revoke ${key.name}`}
                  variant="ghost"
                  onClick={() => setRevoking(key)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Show-once dialog */}
      <Dialog open={!!created} onOpenChange={(open) => !open && setCreated(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy your new API key</DialogTitle>
            <DialogDescription>
              This is the only time the full key is shown. Store it somewhere safe —
              if you lose it, revoke it and create a new one.
            </DialogDescription>
          </DialogHeader>
          {created && (
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all rounded-lg border border-border bg-muted px-3 py-2 text-xs text-foreground">
                {created.token}
              </code>
              <CopyButton value={created.token} label="Copy API key" />
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCreated(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke confirm */}
      <AlertDialog open={!!revoking} onOpenChange={(open) => !open && setRevoking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke &ldquo;{revoking?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              Any client using this key will lose access immediately. This can&apos;t be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} disabled={revokeBusy}>
              {revokeBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Revoke key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disconnect confirm */}
      <AlertDialog open={!!disconnecting} onOpenChange={(open) => !open && setDisconnecting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {disconnecting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              It will lose access right away. You can reconnect later from the app by
              approving it again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnectBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect} disabled={disconnectBusy}>
              {disconnectBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
