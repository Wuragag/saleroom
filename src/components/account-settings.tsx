"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Loader2, Camera } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function AccountSettings() {
  const { data: session, update } = useSession();

  // Profile state
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
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
      toast.error(json.error ?? "Failed to save profile");
      return;
    }

    toast.success("Profile updated");
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
      toast.error(json.error ?? "Failed to update password");
      return;
    }

    toast.success("Password updated");
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
      toast.success("Avatar updated");
      await update(); // Refresh session so nav avatar updates
    } else {
      toast.error("Failed to upload avatar");
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const initials =
    (name?.[0] ?? session?.user?.name?.[0] ?? "?").toUpperCase();

  return (
    <div className="space-y-6">
      {/* Avatar + Profile section */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Profile</h3>

        {/* Avatar */}
        <div className="flex items-center gap-5 mb-6">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload profile photo"
            className="relative w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Avatar"
                width={80}
                height={80}
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
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
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
              <Input
                id="firstName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First name"
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="lastName"
              >
                Last name
              </label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
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
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button type="submit" disabled={profileLoading}>
              {profileLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {profileLoading ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Password section */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">
          Change password
        </h3>

        <form onSubmit={handlePasswordSave} className="space-y-4">
          {passwordError && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
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
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
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
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="confirmNewPassword"
              >
                Confirm new password
              </label>
              <Input
                id="confirmNewPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {passwordLoading ? "Updating…" : "Update password"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
