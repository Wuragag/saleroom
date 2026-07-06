"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, ExternalLink, Eye, MoreVertical, Trash2, Copy, Clock, Link2, Tag as TagIcon } from "lucide-react";
import { timeAgo, formatDuration, TagEditor } from "@/components/page-card";
import { Tag } from "@/components/ui/tag";
import { Avatar } from "@/components/ui/avatar";
import { Monogram } from "@/components/ui/monogram";
import { Badge } from "@/components/ui/badge";
import type { PageAnalytics, PageListItem } from "@/types";

interface PageListRowProps {
  page: PageListItem;
  analytics?: PageAnalytics;
  selected: boolean;
  onToggleSelect: () => void;
  onDeleted: () => void;
  onDuplicated: () => void;
}

export function PageListRow({ page, analytics, selected, onToggleSelect, onDeleted, onDuplicated }: PageListRowProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [tags, setTags] = useState<string[]>(page.tags);
  const [showTagEditor, setShowTagEditor] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiClient.delete(`/api/pages/${page.id}`);
      toast.success("Page deleted");
      onDeleted();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete page");
      setDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      await apiClient.post(`/api/pages/${page.id}/duplicate`);
      toast.success("Page duplicated");
      onDuplicated();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to duplicate page");
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <>
      <div
        className={`group relative flex cursor-pointer items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/40 transition-colors ${selected ? "bg-primary/5" : ""}`}
      >
        <Link
          href={`/analytics/${page.id}`}
          aria-label={`Open analytics for ${page.title}`}
          className="absolute inset-0 z-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        >
          <span className="sr-only">Open analytics for {page.title}</span>
        </Link>

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="relative z-10 h-4 w-4 rounded border-border accent-primary cursor-pointer shrink-0"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        />

        {/* Monogram tile */}
        <span className="relative z-10 shrink-0 pointer-events-none">
          <Monogram name={page.title} size="sm" />
        </span>

        {/* Title + URL */}
        <div className="relative z-10 flex-1 min-w-0 pointer-events-none">
          <span className="text-small font-semibold text-foreground group-hover:text-primary transition-colors truncate block">
            {page.title}
          </span>
          <p className="text-2xs text-tertiary mt-0.5 truncate">
            /p/{page.slug} · {timeAgo(page.updatedAt)}
          </p>
        </div>

        {/* Tags column */}
        <div className="relative z-10 hidden lg:flex items-center gap-1 shrink-0 w-40 pointer-events-none">
          {tags.length > 0 ? (
            <>
              {tags.slice(0, 3).map((t) => (
                <Tag key={t} label={t} size="sm" className="truncate max-w-[4.5rem]" />
              ))}
              {tags.length > 3 && (
                <span className="text-3xs text-muted-foreground">+{tags.length - 3}</span>
              )}
            </>
          ) : (
            <span className="text-3xs text-muted-foreground">—</span>
          )}
        </div>

        {/* Analytics */}
        <div className="relative z-10 hidden md:flex items-center gap-4 text-xs text-muted-foreground shrink-0 pointer-events-none">
          <span className="flex items-center gap-1 w-14 justify-end">
            <Eye className="h-3 w-3" />
            <span className="font-medium text-foreground">{analytics?.views ?? 0}</span>
          </span>
          {analytics && analytics.avgDuration > 0 && (
            <span className="flex items-center gap-1 w-14 justify-end hidden lg:flex">
              <Clock className="h-3 w-3" />
              {formatDuration(analytics.avgDuration)}
            </span>
          )}
          {analytics && analytics.linkClicks > 0 && (
            <span className="flex items-center gap-1 w-8 justify-end hidden lg:flex">
              <Link2 className="h-3 w-3" />
              {analytics.linkClicks}
            </span>
          )}
        </div>

        {/* Status badge */}
        {page.published ? (
          <Badge variant="success" className="relative z-10 shrink-0 hidden sm:inline-flex pointer-events-none">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-ring" />
            Live
          </Badge>
        ) : (
          <Badge variant="neutral" className="relative z-10 shrink-0 hidden sm:inline-flex pointer-events-none">Draft</Badge>
        )}

        {/* User avatar */}
        <span title={page.user.name} className="relative z-10 shrink-0 pointer-events-none">
          <Avatar name={page.user.name} size="sm" className="h-6 w-6 text-3xs" />
        </span>


        {/* Actions */}
        <div
          className="relative z-10 flex items-center gap-1 shrink-0"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Link href={`/editor/${page.id}`}>
            <Button variant="ghost" size="sm" aria-label="Edit" className="h-8 w-8 p-0 rounded-md opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity" title="Edit">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </Link>
          {page.published ? (
            <Link href={`/p/${page.slug}`} target="_blank">
              <Button variant="ghost" size="sm" aria-label="View" className="h-8 w-8 p-0 rounded-md opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity" title="View">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </Link>
          ) : (
            <Link href={`/preview/${page.id}`} target="_blank">
              <Button variant="ghost" size="sm" aria-label="Preview" className="h-8 w-8 p-0 rounded-md opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity" title="Preview">
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
          <DropdownMenu open={menuOpen} onOpenChange={(o) => { if (!o) setShowTagEditor(false); setMenuOpen(o); }}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" aria-label="Page actions" className="h-8 w-8 p-0 rounded-md opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity">
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
