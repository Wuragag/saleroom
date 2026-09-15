"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, Eye, PencilLine, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient, ApiError } from "@/lib/api-client";

interface ConsentRequest {
  response_type: "code";
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: "S256";
  state?: string;
  scope: string;
  resource?: string;
}

interface Props {
  appName: string;
  client: { id: string; name: string; uri: string; logoUri: string };
  user: { name: string; email: string };
  request: ConsentRequest;
}

const PERMISSIONS = [
  { icon: Eye, text: "See your pages, deals, contacts and buyer engagement" },
  { icon: PencilLine, text: "Create and edit pages, deals and action plans" },
  { icon: Share2, text: "Publish pages and share tracked links on your behalf" },
];

function clientHost(uri: string): string {
  try {
    return new URL(uri).host;
  } catch {
    return "";
  }
}

export function OAuthConsent({ appName, client, user, request }: Props) {
  const [busy, setBusy] = useState<"allow" | "deny" | null>(null);
  const [error, setError] = useState("");

  async function decide(approved: boolean) {
    setBusy(approved ? "allow" : "deny");
    setError("");
    try {
      const { redirectTo } = await apiClient.post<{ redirectTo: string }>(
        "/api/oauth/authorize",
        { ...request, approved }
      );
      window.location.assign(redirectTo);
    } catch (err) {
      setBusy(null);
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  }

  const host = clientHost(client.uri);

  return (
    <div className="max-w-md w-full bg-card border border-border rounded-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-foreground leading-tight">
            Connect {client.name} to {appName}
          </h1>
          {host && <p className="text-xs text-muted-foreground truncate">{host}</p>}
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        <span className="font-medium text-foreground">{client.name}</span> is asking to
        access your {appName} workspace as{" "}
        <span className="font-medium text-foreground">{user.email}</span>. It will be
        able to:
      </p>

      <ul className="space-y-2.5 mb-6">
        {PERMISSIONS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-2.5 text-sm text-foreground">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span>{text}</span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted-foreground mb-6">
        Everything it does is limited to what you can do yourself. You can disconnect
        it any time from Settings → Integrations.
      </p>

      {error && (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          disabled={busy !== null}
          onClick={() => decide(false)}
        >
          {busy === "deny" && <Loader2 className="h-4 w-4 animate-spin" />}
          Cancel
        </Button>
        <Button className="flex-1" disabled={busy !== null} onClick={() => decide(true)}>
          {busy === "allow" && <Loader2 className="h-4 w-4 animate-spin" />}
          Allow access
        </Button>
      </div>
    </div>
  );
}
