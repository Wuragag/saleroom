"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  Mail,
  Crown,
  UserMinus,
  X,
  Send,
  Loader2,
} from "lucide-react";
import type { TeamMemberData, TeamInviteData } from "@/types";

export function TeamSettings() {
  const { data: session } = useSession();
  const [teamName, setTeamName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [members, setMembers] = useState<TeamMemberData[]>([]);
  const [invites, setInvites] = useState<TeamInviteData[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isOwner = (session?.user as any)?.teamRole === "OWNER";

  const fetchTeam = useCallback(async () => {
    try {
      const [teamRes, invitesRes] = await Promise.all([
        fetch("/api/team"),
        isOwner ? fetch("/api/team/invite") : Promise.resolve(null),
      ]);

      if (teamRes.ok) {
        const team = await teamRes.json();
        setTeamName(team.name);
        setMembers(team.members ?? []);
      }
      if (invitesRes?.ok) {
        const data = await invitesRes.json();
        setInvites(data);
      }
    } catch (err) {
      console.error("Failed to fetch team:", err);
    } finally {
      setLoading(false);
    }
  }, [isOwner]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  async function handleSaveName() {
    if (!teamName.trim()) return;
    setSavingName(true);
    try {
      const res = await fetch("/api/team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName.trim() }),
      });
      if (res.ok) {
        setEditingName(false);
      }
    } catch (err) {
      console.error("Failed to save team name:", err);
    } finally {
      setSavingName(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviteLoading(true);
    setInviteError("");
    setInviteSuccess("");

    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setInviteError(data.error);
      } else {
        setInviteSuccess(`Invite sent to ${inviteEmail.trim()}`);
        setInviteEmail("");
        fetchTeam();
      }
    } catch {
      setInviteError("Failed to send invite");
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      const res = await fetch(`/api/team/members/${memberId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      }
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  }

  async function handleCancelInvite(inviteId: string) {
    try {
      const res = await fetch(`/api/team/invite/${inviteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      }
    } catch (err) {
      console.error("Failed to cancel invite:", err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team name */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Team
        </h3>
        <div className="flex items-center gap-3">
          {editingName && isOwner ? (
            <>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                disabled={savingName}
                className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {savingName ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setEditingName(false)}
                className="h-9 px-3 rounded-lg border border-border text-sm hover:bg-muted"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <span className="text-sm text-foreground font-medium">{teamName}</span>
              {isOwner && (
                <button
                  onClick={() => setEditingName(true)}
                  className="text-xs text-primary hover:underline"
                >
                  Edit
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Members */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">
            Members ({members.length})
          </h3>
        </div>
        <div className="divide-y divide-border">
          {members.map((member) => (
            <div
              key={member.id}
              className="px-6 py-3 flex items-center gap-3"
            >
              {member.user.avatarUrl ? (
                <img
                  src={member.user.avatarUrl}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                  {member.user.name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {member.user.name} {member.user.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {member.user.email}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {member.role === "OWNER" && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">
                    <Crown className="h-3 w-3" />
                    Owner
                  </span>
                )}
                {isOwner && member.userId !== session?.user?.id && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="Remove member"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite (owner only) */}
      {isOwner && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Invite members
          </h3>

          <form onSubmit={handleInvite} className="flex items-center gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => {
                setInviteEmail(e.target.value);
                setInviteError("");
                setInviteSuccess("");
              }}
              placeholder="colleague@company.com"
              className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="submit"
              disabled={inviteLoading || !inviteEmail.trim()}
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {inviteLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Send
            </button>
          </form>

          {inviteError && (
            <p className="text-sm text-red-500 mt-2">{inviteError}</p>
          )}
          {inviteSuccess && (
            <p className="text-sm text-emerald-600 mt-2">{inviteSuccess}</p>
          )}

          {/* Pending invites */}
          {invites.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                Pending invites
              </p>
              <div className="space-y-2">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="text-sm text-foreground">{invite.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Expires{" "}
                        {new Date(invite.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCancelInvite(invite.id)}
                      className="p-1 rounded text-muted-foreground hover:text-red-500 transition-colors"
                      title="Cancel invite"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
