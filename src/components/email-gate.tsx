"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { apiClient, ApiError } from "@/lib/api-client";
import { PubGate, PUB_GATE_STYLES, type PubGatePageStyle } from "@/components/pub-gate";

interface EmailGateProps {
  pageId: string;
  slug: string;
  /** The page's brand style so the gate matches the page behind it. */
  pageStyle: PubGatePageStyle;
}

export function EmailGate({ pageId, slug, pageStyle }: EmailGateProps) {
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

  const inputClass =
    "w-full px-3 py-2.5 text-sm transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1";

  return (
    <PubGate
      style={pageStyle}
      icon={<Mail className="h-6 w-6" />}
      title="Enter your email to continue"
      description="Your email helps the sender know you've viewed this page."
      footnote="By continuing, you agree that your email and activity on this page may be shared with the sender."
    >
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
        <input
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          style={PUB_GATE_STYLES.input}
          aria-label="Email address"
          autoFocus
          required
        />
        <input
          type="text"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          style={PUB_GATE_STYLES.input}
          aria-label="Your name (optional)"
        />
        {error && (
          <p
            role="alert"
            className="px-3 py-2 text-xs text-center"
            style={PUB_GATE_STYLES.error}
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          className="w-full py-2.5 px-4 text-sm font-semibold transition-opacity hover:opacity-90 active:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 flex items-center justify-center gap-2"
          style={PUB_GATE_STYLES.button}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
        </button>
      </form>
    </PubGate>
  );
}
