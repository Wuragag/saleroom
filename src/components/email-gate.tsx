"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail } from "lucide-react";
import { apiClient, ApiError } from "@/lib/api-client";

interface EmailGateProps {
  pageId: string;
  slug: string;
}

export function EmailGate({ pageId, slug }: EmailGateProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiClient.post(`/api/pages/${pageId}/gate`, { email: trimmed, name: name.trim() || undefined });
      // Reload the page — the server will now see the ref cookie and show content
      window.location.href = `/p/${slug}`;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-6 p-8 rounded-2xl border border-border bg-card shadow-lg">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-6 w-6 text-primary" />
          </div>

          <div className="text-center">
            <h1 className="text-lg font-bold text-foreground">
              Enter your email to continue
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your email helps the sender know you&apos;ve viewed this page.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg"
              autoFocus
              required
            />
            <Input
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg"
            />
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full rounded-lg gap-2" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Continue"
              )}
            </Button>
          </form>

          <p className="text-3xs text-muted-foreground text-center">
            By continuing, you agree that your email and activity on this page may be shared with the sender.
          </p>
        </div>
      </div>
    </main>
  );
}
