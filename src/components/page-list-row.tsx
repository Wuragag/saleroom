"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, ExternalLink, Eye, MoreVertical, Trash2, Copy, Clock, Link2, Tag } from "lucide-react";
import { tagColor, timeAgo, formatDuration } from "@/components/page-card";
import type { PageAnalytics, PageListItem } from "@/types";
import { getAccentColor } from "@/lib/page-styles";

const AVATAR_COLORS = ["#7c3aed","#0284c7","#059669","#d97706","#e11d48","#0891b2"];
function avatarBg(name: string) {
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
function initials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

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

  const accent = getAccentColor(page.accentColor);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/pages/${page.id}`, { method: "DELETE" });
      toast.success("Page deleted");
      onDeleted();
    } catch {
      toast.error("Failed to delete page");
      setDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      await fetch(`/api/pages/${page.id}/duplicate`, { method: "POST" });
      toast.success("Page duplicated");
      onDuplicated();
    } catch {
      toast.error("Failed to duplicate page");
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <>
      <div
        className={`group flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/40 transition-colors ${selected ? "bg-primary/5" : ""}`}
      >
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="h-4 w-4 rounded border-border accent-primary cursor-pointer shrink-0"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Accent dot */}
        <div
          className="h-2 w-2 rounded-full shrink-0 hidden sm:block"
          style={{ backgroundColor: accent }}
        />

        {/* Title + tags */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Link href={`/editor/${page.id}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate">
              {page.title}
            </Link>
            {page.tags.length > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                {page.tags.slice(0, 3).map((t) => {
                  const c = tagColor(t);
                  return (
                    <span key={t} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full hidden sm:inline-flex" style={{ backgroundColor: c.bg, color: c.text }}>
                      {t}
                    </span>
                  );
                })}
                {page.tags.length > 3 && (
                  <span className="text-[10px] text-muted-foreground hidden sm:inline">+{page.tags.length - 3}</span>
                )}
              </div>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">{timeAgo(page.updatedAt)}</p>
        </div>

        {/* Analytics */}
        <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
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
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 hidden sm:inline-flex"
          style={page.published
            ? { backgroundColor: `${accent}18`, color: accent }
            : { backgroundColor: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
        >
          {page.published ? "Published" : "Draft"}
        </span>

        {/* User avatar */}
        <div
          className="h-6 w-6 rounded-full flex items-center justify-center text-white shrink-0"
          style={{ backgroundColor: avatarBg(page.user.name), fontSize: "9px", fontWeight: 700 }}
          title={page.user.name}
        >
          {initials(page.user.name)}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Link href={`/editor/${page.id}`}>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" title="Edit">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </Link>
          {page.published ? (
            <Link href={`/p/${page.slug}`} target="_blank">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" title="View">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </Link>
          ) : (
            <Link href={`/preview/${page.id}`} target="_blank">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" title="Preview">
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/editor/${page.id}`} className="cursor-pointer gap-2">
                  <Tag className="h-4 w-4" />Edit tags
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate} disabled={duplicating} className="cursor-pointer gap-2">
                <Copy className="h-4 w-4" />{duplicating ? "Duplicating…" : "Duplicate"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive focus:text-destructive cursor-pointer gap-2">
                <Trash2 className="h-4 w-4" />Delete
              </DropdownMenuItem>
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
