"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Pencil, ExternalLink, MoreVertical, Trash2, Copy,
  Eye, Clock, Link2, Tag as TagIcon, X, Plus, Lock, EyeOff,
} from "lucide-react";
import { PageThumbnail } from "@/components/page-thumbnail";
import { Tag } from "@/components/ui/tag";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { PageAnalytics, PageListItem } from "@/types";

// ── Helpers ──────────────────────────────────────────────────────────────────
export function timeAgo(dateStr: string) {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

import { formatDuration } from "@/lib/format-utils";
export { formatDuration };

// ── Tag editor (shown inline inside DropdownMenuContent) ─────────────────────
export function TagEditor({
  pageId, tags, onSave,
}: { pageId: string; tags: string[]; onSave: (tags: string[]) => void }) {
  const [localTags, setLocalTags] = useState<string[]>(tags);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const addTag = () => {
    const t = input.trim().toLowerCase();
    if (!t || localTags.includes(t) || localTags.length >= 6) return;
    setLocalTags([...localTags, t]);
    setInput("");
  };

  const save = async () => {
    try {
      await fetch(`/api/pages/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: JSON.stringify(localTags) }),
      });
      onSave(localTags);
    } catch {
      toast.error("Failed to save tags");
    }
  };

  return (
    <div className="p-3 w-56 flex flex-col gap-2.5" onClick={(e) => e.stopPropagation()}>
      <p className="text-xs font-semibold text-foreground">Tags</p>
      <div className="flex flex-wrap gap-1 min-h-[22px]">
        {localTags.length === 0 && <span className="text-xs text-muted-foreground">No tags</span>}
        {localTags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1">
            <Tag label={t} size="sm" />
            <button onClick={() => setLocalTags(localTags.filter((x) => x !== t))}><X className="h-2.5 w-2.5" /></button>
          </span>
        ))}
      </div>
      {localTags.length < 6 && (
        <div className="flex gap-1">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
            placeholder="Add tag…"
            className="flex-1 text-xs bg-muted rounded-md px-2 py-1.5 border border-border outline-none focus:ring-1 focus:ring-ring"
          />
          <button onClick={addTag} className="h-7 w-7 flex items-center justify-center rounded-md bg-muted border border-border hover:bg-muted/60">
            <Plus className="h-3 w-3" />
          </button>
        </div>
      )}
      <Button size="sm" className="rounded-md h-7 text-xs w-full" onClick={save}>Save</Button>
    </div>
  );
}

// ── Main card ────────────────────────────────────────────────────────────────
interface PageCardProps {
  page: PageListItem;
  analytics?: PageAnalytics;
}

export function PageCard({ page, analytics }: PageCardProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [tags, setTags] = useState<string[]>(page.tags);
  const [showTagEditor, setShowTagEditor] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/pages/${page.id}`, { method: "DELETE" });
      toast.success("Page deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete page");
      setDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      await fetch(`/api/pages/${page.id}/duplicate`, { method: "POST" });
      toast.success("Page duplicated", { icon: "✨" });
      router.refresh();
    } catch {
      toast.error("Failed to duplicate page");
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <>
      <div className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-elevation-2 hover:-translate-y-1 hover:border-border-strong transition-all duration-300 ease-out flex flex-col">

        {/* Thumbnail */}
        <Link href={`/analytics/${page.id}`} className="block" aria-label={`Open analytics for ${page.title}`}>
          <PageThumbnail title={page.title} background={page.background} accentColor={page.accentColor} />
        </Link>

        {/* Body */}
        <div className="flex flex-col gap-2.5 p-4 flex-1">
          {/* Title + menu */}
          <div className="flex items-start justify-between gap-2">
            <Link href={`/analytics/${page.id}`} className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm leading-snug truncate hover:text-primary transition-colors">
                {page.title}
              </h3>
            </Link>
            <DropdownMenu open={menuOpen} onOpenChange={(o) => { if (!o) setShowTagEditor(false); setMenuOpen(o); }}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Page actions" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity rounded-lg shrink-0">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-0 overflow-hidden">
                {showTagEditor ? (
                  <TagEditor pageId={page.id} tags={tags} onSave={(t) => { setTags(t); setShowTagEditor(false); setMenuOpen(false); }} />
                ) : (
                  <div className="py-1">
                    <DropdownMenuItem className="cursor-pointer gap-2 mx-1 rounded-md" onClick={(e) => { e.preventDefault(); setShowTagEditor(true); }}>
                      <TagIcon className="h-4 w-4" />Manage tags
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDuplicate} disabled={duplicating} className="cursor-pointer gap-2 mx-1 rounded-md">
                      <Copy className="h-4 w-4" />{duplicating ? "Duplicating…" : "Duplicate"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { setMenuOpen(false); setShowDeleteDialog(true); }} className="text-destructive focus:text-destructive cursor-pointer gap-2 mx-1 rounded-md">
                      <Trash2 className="h-4 w-4" />Delete
                    </DropdownMenuItem>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((t) => (
                <Tag key={t} label={t} size="sm" />
              ))}
            </div>
          )}

          {/* Lock / Private badges */}
          {(page.lockedById || page.visibility === "PRIVATE") && (
            <div className="flex items-center gap-1.5">
              {page.lockedById && (
                <Badge variant="warning" className="gap-1 rounded-full text-3xs font-medium px-2 py-0.5">
                  <Lock className="h-2.5 w-2.5" />
                  {page.lockedByName ? `Locked by ${page.lockedByName}` : "Locked"}
                </Badge>
              )}
              {page.visibility === "PRIVATE" && (
                <Badge variant="neutral" className="gap-1 rounded-full text-3xs font-medium px-2 py-0.5">
                  <EyeOff className="h-2.5 w-2.5" />
                  Private
                </Badge>
              )}
            </div>
          )}

          {/* Analytics */}
          {analytics && analytics.views > 0 && (
            <div className="flex items-center gap-3 text-2xs text-muted-foreground">
              <span className="flex items-center gap-1 group-hover:text-foreground transition-colors duration-200">
                <Eye className="h-3 w-3" />
                <span className="tabular-nums font-medium">{analytics.views}</span> views
              </span>
              {analytics.avgDuration > 0 && (
                <span className="flex items-center gap-1 group-hover:text-foreground transition-colors duration-200">
                  <Clock className="h-3 w-3" />
                  {formatDuration(analytics.avgDuration)}
                </span>
              )}
              {analytics.linkClicks > 0 && (
                <span className="flex items-center gap-1 group-hover:text-foreground transition-colors duration-200">
                  <Link2 className="h-3 w-3" />
                  <span className="tabular-nums font-medium">{analytics.linkClicks}</span>
                </span>
              )}
            </div>
          )}

          {/* Footer: avatar + time + status */}
          <div className="mt-auto flex items-center justify-between gap-2 pt-2.5 border-t border-border">
            <div className="flex items-center gap-1.5 min-w-0">
              <Avatar name={page.user.name} size="xs" />
              <span className="text-2xs text-muted-foreground truncate">{timeAgo(page.updatedAt)}</span>
            </div>
            {page.published ? (
              <Badge variant="success" className="shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-ring" />
                Live
              </Badge>
            ) : (
              <Badge variant="neutral" className="shrink-0">Draft</Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 px-4 pb-4">
          <Link href={`/editor/${page.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full rounded-lg text-xs gap-1.5">
              <Pencil className="h-3 w-3" />Edit
            </Button>
          </Link>
          {page.published ? (
            <Link href={`/p/${page.slug}`} target="_blank" className="flex-1">
              <Button variant="ghost" size="sm" className="w-full rounded-lg text-xs gap-1.5">
                <ExternalLink className="h-3 w-3" />View
              </Button>
            </Link>
          ) : (
            <Link href={`/preview/${page.id}`} target="_blank" className="flex-1">
              <Button variant="ghost" size="sm" className="w-full rounded-lg text-xs gap-1.5">
                <Eye className="h-3 w-3" />Preview
              </Button>
            </Link>
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{page.title}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this page and all its content. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
