"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Camera, Check } from "lucide-react";

export function AccountSettings() {
  const { data: session, update } = useSession();

  // Profile state
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Avatar state
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profile on mount
  useEffect(() => {
    async function load() {
      const res = await fetch("/api/account/profile");
      if (res.ok) {
        const data = await res.json();
        setName(data.name ?? "");
        setLastName(data.lastName ?? "");
        setEmail(data.email ?? "");
        setAvatarUrl(data.avatarUrl ?? "");
      }
    }
    load();
  }, []);

  // Clear success messages after 3s
  useEffect(() => {
    if (profileSuccess) {
      const t = setTimeout(() => setProfileSuccess(false), 3000);
      return () => clearTimeout(t);
    }
  }, [profileSuccess]);

  useEffect(() => {
    if (passwordSuccess) {
      const t = setTimeout(() => setPasswordSuccess(false), 3000);
      return () => clearTimeout(t);
    }
  }, [passwordSuccess]);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileError("");
    setProfileLoading(true);

    const res = await fetch("/api/account/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, lastName, email }),
    });

    const json = await res.json().catch(() => ({}));
    setProfileLoading(false);

    if (!res.ok) {
      setProfileError(json.error ?? "Something went wrong");
      return;
    }

    setProfileSuccess(true);
    await update(); // Refresh session
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setPasswordLoading(true);

    const res = await fetch("/api/account/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const json = await res.json().catch(() => ({}));
    setPasswordLoading(false);

    if (!res.ok) {
      setPasswordError(json.error ?? "Something went wrong");
      return;
    }

    setPasswordSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/account/avatar", {
      method: "POST",
      body: formData,
    });

    const json = await res.json().catch(() => ({}));
    setAvatarLoading(false);

    if (res.ok && json.url) {
      setAvatarUrl(json.url);
      await update(); // Refresh session so nav avatar updates
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const initials =
    (name?.[0] ?? session?.user?.name?.[0] ?? "?").toUpperCase();

  return (
    <div className="space-y-6">
      {/* Avatar + Profile section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Profile</h3>

        {/* Avatar */}
        <div className="flex items-center gap-5 mb-6">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden group shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl font-semibold text-muted-foreground">
                {initials}
              </span>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {avatarLoading ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
            </div>
          </button>
          <div>
            <p className="text-sm font-medium text-foreground">Profile photo</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              JPG, PNG or WebP. Max 2 MB.
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>

        {/* Profile form */}
        <form onSubmit={handleProfileSave} className="space-y-4">
          {profileError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {profileError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="firstName"
              >
                First name
              </label>
              <input
                id="firstName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First name"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="lastName"
              >
                Last name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="email"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={profileLoading}
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {profileLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {profileLoading ? "Saving…" : "Save changes"}
            </button>
            {profileSuccess && (
              <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
                <Check className="h-4 w-4" />
                Saved
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Password section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">
          Change password
        </h3>

        <form onSubmit={handlePasswordSave} className="space-y-4">
          {passwordError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {passwordError}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="currentPassword"
            >
              Current password
            </label>
            <input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="newPassword"
              >
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="confirmNewPassword"
              >
                Confirm new password
              </label>
              <input
                id="confirmNewPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={passwordLoading}
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {passwordLoading && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {passwordLoading ? "Updating…" : "Update password"}
            </button>
            {passwordSuccess && (
              <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
                <Check className="h-4 w-4" />
                Password updated
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
