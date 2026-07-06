"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/auth-layout";

// ── Quotes ────────────────────────────────────────────────────────────────────
const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" },
  { text: "Don't count the days. Make the days count.", author: "Muhammad Ali" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "The harder I work, the luckier I get.", author: "Samuel Goldwyn" },
  { text: "Great things are done by a series of small things brought together.", author: "Vincent Van Gogh" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
];

// ── Loading screen ────────────────────────────────────────────────────────────
function LoadingScreen() {
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * QUOTES.length)
  );
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      // Fade out
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % QUOTES.length);
        // Fade in
        setVisible(true);
      }, 500);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const quote = QUOTES[index];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 gap-10">
      {/* Spinner */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-11 w-11">
          <div className="absolute inset-0 rounded-full border-[3px] border-primary/15" />
          <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary animate-spin" />
        </div>
        <p className="text-sm font-medium text-foreground tracking-tight">
          Signing you in…
        </p>
      </div>

      {/* Quote */}
      <div
        className="max-w-xs text-center"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      >
        <p className="text-sm text-muted-foreground leading-relaxed italic">
          &ldquo;{quote.text}&rdquo;
        </p>
        <p className="text-2xs text-muted-foreground/60 mt-2 font-medium tracking-wide">
          — {quote.author}
        </p>
      </div>
    </div>
  );
}

// ── Sign-in form ──────────────────────────────────────────────────────────────
function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Validate callbackUrl is a safe relative path (prevent open redirect)
  const rawCallback = searchParams.get("callbackUrl") ?? "/";
  const callbackUrl = rawCallback.startsWith("/") && !rawCallback.startsWith("//") ? rawCallback : "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setLoading(false);
        setError("Invalid email or password");
      } else {
        // Keep loading=true while navigating
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setLoading(false);
      setError("Something went wrong. Please try again.");
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <AuthLayout
      art="/redesign/hero-doorway.jpg"
      eyebrow="Welcome back"
      headline="Every deal deserves its own room."
    >
      <h1 className="mt-1.5 font-display text-display text-foreground">
        Sign in
      </h1>
      <p className="mt-1 text-body text-muted-foreground">
        Pick up right where you left off.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        {error && (
          <div
            id="signin-error"
            role="alert"
            aria-live="polite"
            className="rounded-lg border border-destructive/30 bg-destructive-subtle px-3 py-2.5 text-small text-destructive-subtle-foreground"
          >
            {error}
          </div>
        )}

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-small font-medium text-foreground" htmlFor="email">
            Work email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "signin-error" : undefined}
            className="h-10 w-full rounded-lg border-[1.5px] border-border-strong bg-card px-3.5 text-body text-foreground placeholder:text-muted-foreground transition-all focus:border-foreground focus:shadow-ring-soft focus:outline-none"
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-small font-medium text-foreground" htmlFor="password">
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-2xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "signin-error" : undefined}
              className="h-10 w-full rounded-lg border-[1.5px] border-border-strong bg-card px-3.5 pr-10 text-body text-foreground placeholder:text-muted-foreground transition-all focus:border-foreground focus:shadow-ring-soft focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <Button type="submit" size="lg" disabled={loading} className="mt-1 w-full">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-small text-muted-foreground">
        Need a workspace?{" "}
        <Link href="/auth/signup" className="font-medium text-foreground hover:underline">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
