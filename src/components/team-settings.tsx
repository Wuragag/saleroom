"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import {
  Users,
  Mail,
  Crown,
  UserMinus,
  X,
  Send,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/api-client";
import type { TeamMemberData, TeamInviteData } from "@/types";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [memberToRemove, setMemberToRemove] = useState<TeamMemberData | null>(
    null
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isOwner = (session?.user as any)?.teamRole === "OWNER";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canInvite = (session?.user as any)?.planLimits?.canInvite ?? false;

  const fetchTeam = useCallback(async () => {
    try {
      const [teamResult, invitesResult] = await Promise.allSettled([
        apiClient.get<{ name: string; members?: TeamMemberData[] }>("/api/team"),
        isOwner ? apiClient.get<TeamInviteData[]>("/api/team/invite") : Promise.resolve(null),
      ]);

      if (teamResult.status === "fulfilled" && teamResult.value) {
        setTeamName(teamResult.value.name);
        setMembers(teamResult.value.members ?? []);
      }
      if (invitesResult.status === "fulfilled" && invitesResult.value) {
        setInvites(invitesResult.value);
      }
      if (teamResult.status === "rejected") {
        toast.error("Failed to load team data");
      }
    } catch {
      toast.error("Failed to load team data");
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
      await apiClient.put("/api/team", { name: teamName.trim() });
      setEditingName(false);
      toast.success("Team name updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save team name");
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
      await apiClient.post("/api/team/invite", { email: inviteEmail.trim() });
      setInviteSuccess(`Invite sent to ${inviteEmail.trim()}`);
      setInviteEmail("");
      fetchTeam();
    } catch (err) {
      setInviteError(err instanceof ApiError ? err.message : "Failed to send invite");
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    try {
      await apiClient.delete(`/api/team/members/${memberId}`);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast.success("Member removed");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to remove member");
    }
  }

  async function handleCancelInvite(inviteId: string) {
    try {
      await apiClient.delete(`/api/team/invite/${inviteId}`);
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      toast.success("Invite cancelled");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to cancel invite");
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
              <Input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                aria-label="Team name"
                className="flex-1"
                autoFocus
              />
              <Button onClick={handleSaveName} disabled={savingName}>
                {savingName ? "Saving..." : "Save"}
              </Button>
              <Button variant="outline" onClick={() => setEditingName(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <span className="text-sm text-foreground font-medium">{teamName}</span>
              {isOwner && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => setEditingName(true)}
                >
                  Edit
                </Button>
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
                <Image
                  src={member.user.avatarUrl}
                  alt=""
                  width={32}
                  height={32}
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
                    onClick={() => setMemberToRemove(member)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
                    aria-label={`Remove ${member.user.name ?? "member"} ${member.user.lastName ?? ""}`.trim()}
                    title="Remove member"
                  >
                    <UserMinus className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite (owner only) */}
      {isOwner && !canInvite && (
        <UpgradePrompt
          message="Team invites are not available on your current plan."
          targetPlan="PRO"
        />
      )}
      {isOwner && canInvite && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Invite members
          </h3>

          <form onSubmit={handleInvite} className="flex items-center gap-2">
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => {
                setInviteEmail(e.target.value);
                setInviteError("");
                setInviteSuccess("");
              }}
              placeholder="colleague@company.com"
              aria-label="Invite member by email"
              className="flex-1"
            />
            <Button type="submit" disabled={inviteLoading || !inviteEmail.trim()}>
              {inviteLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Send
            </Button>
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
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
                      aria-label={`Cancel invite to ${invite.email}`}
                      title="Cancel invite"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Remove member confirmation */}
      <AlertDialog
        open={memberToRemove !== null}
        onOpenChange={(open) => {
          if (!open) setMemberToRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              {memberToRemove && (
                <>
                  This will remove{" "}
                  <span className="font-medium text-foreground">
                    {`${memberToRemove.user.name ?? ""} ${
                      memberToRemove.user.lastName ?? ""
                    }`.trim() || memberToRemove.user.email}
                  </span>{" "}
                  ({memberToRemove.user.email}) from the team. They&apos;ll lose
                  access to all team pages. This can&apos;t be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={() => {
                if (memberToRemove) {
                  handleRemoveMember(memberToRemove.id);
                  setMemberToRemove(null);
                }
              }}
            >
              Remove member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
