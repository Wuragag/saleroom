"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Send, Trash2 } from "lucide-react";

import { apiClient, ApiError } from "@/lib/api-client";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { SectionLabel } from "@/components/ui/section-label";
import { formatRelativeTime } from "@/lib/format-utils";
import { memberDisplayName } from "@/components/deals/member-picker";
import type { DealCommentData } from "@/types";

const COMMENT_MAX = 2000;

interface DealCommentsCardProps {
  dealId: string;
  comments: DealCommentData[];
  currentUserId: string;
  /** Viewer can delete anyone's comment (deal owner or team OWNER). */
  canModerate: boolean;
  onChanged: () => void;
}

export function DealCommentsCard({
  dealId,
  comments,
  currentUserId,
  canModerate,
  onChanged,
}: DealCommentsCardProps) {
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text || posting) return;
    setPosting(true);
    try {
      await apiClient.post(`/api/deals/${dealId}/comments`, { body: text });
      setBody("");
      onChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to post comment");
    } finally {
      setPosting(false);
    }
  };

  const remove = async (comment: DealCommentData) => {
    if (deletingId) return;
    setDeletingId(comment.id);
    try {
      await apiClient.delete(`/api/deals/${dealId}/comments/${comment.id}`);
      onChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete comment");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <SectionLabel>
          Comments{comments.length > 0 ? ` · ${comments.length}` : ""}
        </SectionLabel>
      </div>

      <form onSubmit={post} className="space-y-2 border-b border-border px-4 py-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) post(e);
          }}
          placeholder="Add a note for your team…"
          maxLength={COMMENT_MAX}
          rows={2}
          aria-label="New comment"
          className="w-full resize-y rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={!body.trim() || posting}>
            <Send />
            {posting ? "Posting…" : "Post"}
          </Button>
        </div>
      </form>

      {comments.length === 0 ? (
        <p className="px-4 py-5 text-sm text-muted-foreground">
          No comments yet. Notes here are visible to your team, never to buyers.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {comments.map((comment) => {
            const display = memberDisplayName(comment.author);
            const canDelete = comment.author.id === currentUserId || canModerate;
            return (
              <div key={comment.id} className="flex gap-3 px-4 py-3">
                <Avatar
                  name={display}
                  src={comment.author.avatarUrl || null}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-baseline gap-2 text-2xs text-muted-foreground">
                    <span className="truncate text-xs font-medium text-foreground">
                      {display}
                    </span>
                    {formatRelativeTime(comment.createdAt)}
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-foreground">
                    {comment.body}
                  </p>
                </div>
                {canDelete && (
                  <IconButton
                    aria-label={`Delete comment by ${display}`}
                    size="sm"
                    className="shrink-0"
                    disabled={deletingId === comment.id}
                    onClick={() => remove(comment)}
                  >
                    <Trash2 />
                  </IconButton>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
