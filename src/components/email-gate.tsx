"use client";

import { useState } from "react";
import { Loader2, Mail, MailCheck } from "lucide-react";
import { apiClient, ApiError } from "@/lib/api-client";
import { EMAIL_RE } from "@/lib/page-gate";
import { PubGate, PUB_GATE_STYLES, type PubGatePageStyle } from "@/components/pub-gate";

interface EmailGateProps {
  pageId: string;
  slug: string;
  /** The page's brand style so the gate matches the page behind it. */
  pageStyle: PubGatePageStyle;
  /** Page requires a verified address — the gate emails a magic link. */
  verifyEmail?: boolean;
  /** Referrer: whose personal link this browser arrived through (from the httpOnly cookie). */
  viaToken?: string;
  /** Known recipient (this browser came through their personal link). */
  prefillEmail?: string;
  prefillName?: string;
  /** Server-side notice, e.g. an expired magic link. */
  initialError?: string | null;
}

export function EmailGate({
  pageId,
  slug,
  pageStyle,
  verifyEmail = false,
  viaToken,
  prefillEmail,
  prefillName,
  initialError = null,
}: EmailGateProps) {
  const [email, setEmail] = useState(prefillEmail ?? "");
  const [name, setName] = useState(prefillName ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !EMAIL_RE.test(trimmed)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.post<{ success?: boolean; verificationSent?: boolean }>(
        `/api/pages/${pageId}/gate`,
        { email: trimmed, name: name.trim() || undefined, via: viaToken }
      );
      if (res.verificationSent) {
        setSentTo(trimmed);
        setLoading(false);
        return;
      }
      // Reload the page — the server will now see the identity cookie and show content
      window.location.href = `/p/${slug}`;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2.5 text-sm transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1";

  if (sentTo) {
    return (
      <PubGate
        style={pageStyle}
        icon={<MailCheck className="h-6 w-6" />}
        title="Check your inbox"
        description={
          <>
            We sent a link to <strong>{sentTo}</strong>. Open it to view this page.
            The link expires in 15 minutes.
          </>
        }
      >
        <button
          type="button"
          className="w-full py-2.5 px-4 text-sm font-semibold transition-opacity hover:opacity-90 active:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={PUB_GATE_STYLES.button}
          onClick={() => setSentTo(null)}
        >
          Use a different email
        </button>
      </PubGate>
    );
  }

  return (
    <PubGate
      style={pageStyle}
      icon={<Mail className="h-6 w-6" />}
      title={verifyEmail ? "Confirm your email to continue" : "Enter your email to continue"}
      description={
        verifyEmail
          ? "We'll email you a link to open this page. This confirms it's really you."
          : "Your email helps the sender know you've viewed this page."
      }
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
          autoFocus={!prefillEmail}
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
          autoFocus={!!prefillEmail}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : verifyEmail ? (
            "Email me a link"
          ) : (
            "Continue"
          )}
        </button>
      </form>
    </PubGate>
  );
}
