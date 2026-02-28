"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, CheckCircle, XCircle } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Redirect to forgot-password if no token
  useEffect(() => {
    if (!token) router.replace("/auth/forgot-password");
  }, [token, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const json = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Something went wrong. Please try again.");
      return;
    }

    setDone(true);
    // Auto-redirect to sign-in after 3 seconds
    setTimeout(() => router.push("/auth/signin"), 3000);
  }

  if (!token) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">SalesRoom</h1>
          <p className="text-sm text-muted-foreground mt-1">Choose a new password</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          {done ? (
            /* Success state */
            <div className="text-center py-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 mb-4">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <h2 className="text-base font-semibold text-foreground mb-2">Password updated</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your password has been reset. Redirecting you to sign in…
              </p>
            </div>
          ) : (
            /* Form state */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Token error (expired / invalid) shown inline */}
              {error && error.toLowerCase().includes("link") ? (
                <div className="text-center py-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-4">
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">Link expired</p>
                  <p className="text-sm text-muted-foreground mb-4">{error}</p>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-primary font-medium hover:underline"
                  >
                    Request a new link
                  </Link>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {error}
                    </div>
                  )}

                  {/* New password */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground" htmlFor="password">
                      New password
                    </label>
                    <input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
                    />
                  </div>

                  {/* Confirm password */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground" htmlFor="confirm">
                      Confirm new password
                    </label>
                    <input
                      id="confirm"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {loading ? "Updating…" : "Set new password"}
                  </button>
                </>
              )}
            </form>
          )}
        </div>

        {/* Back to sign-in */}
        {!done && (
          <div className="text-center mt-5">
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
