"use client";

import { useState, useMemo } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { apiClient, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/auth-layout";
import { cn } from "@/lib/utils";

const STRENGTH = [
  { label: "Too short", bar: "bg-destructive", text: "text-destructive" },
  { label: "Weak", bar: "bg-destructive", text: "text-destructive" },
  { label: "Okay", bar: "bg-warning", text: "text-warning" },
  { label: "Strong", bar: "bg-success", text: "text-success" },
] as const;

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Live strength: length + letter/number/symbol mix → 0–3
  const strength = useMemo(() => {
    if (!password) return 0;
    if (password.length < 8) return 1;
    let s = 1;
    if (/[a-zA-Z]/.test(password) && /[0-9]/.test(password)) s++;
    if (password.length >= 12 || /[^a-zA-Z0-9]/.test(password)) s++;
    return s;
  }, [password]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await apiClient.post("/api/auth/signup", { name: trimmedName, email, password, company });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    // Auto sign-in after registration — keep loading=true during navigation
    const signInRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (signInRes?.error) {
      setLoading(false);
      router.push("/auth/signin");
    } else {
      router.push("/onboarding");
      router.refresh();
    }
  }

  const inputClass =
    "h-10 w-full rounded-lg border-[1.5px] border-border-strong bg-card px-3.5 text-body text-foreground placeholder:text-muted-foreground transition-all focus:border-foreground focus:shadow-ring-soft focus:outline-none";

  return (
    <AuthLayout
      art="/redesign/hero-signup.jpg"
      eyebrow="Create your workspace"
      headline="Turn every proposal into a room buyers remember."
    >
      <h1 className="mt-1.5 font-display text-display text-foreground">
        Get started
      </h1>
      <p className="mt-1 text-body text-muted-foreground">
        Free to try. No credit card required.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        {error && (
          <div
            id="signup-error"
            role="alert"
            aria-live="polite"
            className="rounded-lg border border-destructive/30 bg-destructive-subtle px-3 py-2.5 text-small text-destructive-subtle-foreground"
          >
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-small font-medium text-foreground" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-small font-medium text-foreground" htmlFor="company">
            Company
          </label>
          <input
            id="company"
            type="text"
            autoComplete="organization"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Acme Inc."
            className={inputClass}
          />
        </div>

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
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-small font-medium text-foreground" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              aria-describedby="password-strength"
              className={cn(inputClass, "pr-10")}
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
          {/* Live strength meter */}
          <div id="password-strength" className="flex items-center gap-2">
            <div className="flex flex-1 gap-1">
              {[1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    password && strength >= i ? STRENGTH[strength].bar : "bg-muted"
                  )}
                />
              ))}
            </div>
            {password && (
              <span className={cn("text-2xs font-medium", STRENGTH[strength].text)}>
                {STRENGTH[strength].label}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-small font-medium text-foreground" htmlFor="confirm">
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirm"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter your password"
              aria-invalid={error === "Passwords do not match" ? true : undefined}
              aria-describedby={error === "Passwords do not match" ? "signup-error" : undefined}
              className={cn(inputClass, "pr-10")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" size="lg" disabled={loading} className="mt-1 w-full">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Creating workspace…" : "Create workspace"}
        </Button>

        <p className="text-2xs leading-relaxed text-tertiary">
          By creating a workspace you agree to our Terms and Privacy Policy.
        </p>
      </form>

      <p className="mt-6 text-center text-small text-muted-foreground">
        Already have an account?{" "}
        <Link href="/auth/signin" className="font-medium text-foreground hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
