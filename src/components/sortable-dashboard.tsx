"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageCard } from "@/components/page-card";
import { PageListRow } from "@/components/page-list-row";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  Tag,
  Trash2,
  User,
  X,
} from "lucide-react";
import type { PageAnalytics, PageListItem } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type SortKey = "updatedAt" | "createdAt" | "title" | "views" | "published";
type ViewMode = "card" | "list";
type StatusFilter = "all" | "published" | "draft";

interface SortableDashboardProps {
  pages: PageListItem[];
  analyticsMap: Record<string, PageAnalytics>;
}

// ---------------------------------------------------------------------------
// Sort options
// ---------------------------------------------------------------------------
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "updatedAt", label: "Last modified" },
  { value: "createdAt", label: "Newest first" },
  { value: "title",     label: "Name A–Z" },
  { value: "views",     label: "Most views" },
  { value: "published", label: "Published first" },
];

// ---------------------------------------------------------------------------
// Pill button helper
// ---------------------------------------------------------------------------
function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function SortableDashboard({ pages: initialPages, analyticsMap }: SortableDashboardProps) {
  const router = useRouter();
  const [pages, setPages] = useState<PageListItem[]>(initialPages);
  const [sort, setSort] = useState<SortKey>("updatedAt");
  const [view, setView] = useState<ViewMode>("card");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeUser, setActiveUser] = useState<string | null>(null);

  // Bulk delete
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Persist view mode
  useEffect(() => {
    const saved = localStorage.getItem("dashboard-view") as ViewMode | null;
    if (saved === "card" || saved === "list") setView(saved);
  }, []);

  const setViewMode = (v: ViewMode) => {
    setView(v);
    localStorage.setItem("dashboard-view", v);
    setSelected(new Set());
  };

  // Derived filter options
  const allTags = useMemo(() => {
    const s = new Set<string>();
    pages.forEach((p) => p.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [pages]);

  const allUsers = useMemo(() => {
    const s = new Set<string>();
    pages.forEach((p) => s.add(p.user.name));
    return Array.from(s).sort();
  }, [pages]);

  const hasMultipleUsers = allUsers.length > 1;

  // Active filter count (for badge)
  const activeFilterCount = [
    search.trim() !== "",
    statusFilter !== "all",
    activeTag !== null,
    activeUser !== null,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setActiveTag(null);
    setActiveUser(null);
  };

  // Apply all filters
  const filtered = useMemo(() => {
    let arr = [...pages];
    const q = search.trim().toLowerCase();
    if (q) arr = arr.filter((p) => p.title.toLowerCase().includes(q));
    if (statusFilter === "published") arr = arr.filter((p) => p.published);
    if (statusFilter === "draft") arr = arr.filter((p) => !p.published);
    if (activeTag) arr = arr.filter((p) => p.tags.includes(activeTag));
    if (activeUser) arr = arr.filter((p) => p.user.name === activeUser);
    return arr;
  }, [pages, search, statusFilter, activeTag, activeUser]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sort) {
      case "updatedAt":
        return arr.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      case "createdAt":
        return arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case "title":
        return arr.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
      case "views":
        return arr.sort((a, b) => (analyticsMap[b.id]?.views ?? 0) - (analyticsMap[a.id]?.views ?? 0));
      case "published":
        return arr.sort((a, b) => {
          if (a.published !== b.published) return a.published ? -1 : 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
      default:
        return arr;
    }
  }, [filtered, analyticsMap, sort]);

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Sort";

  // Selection
  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }, []);

  const toggleSelectAll = () => {
    setSelected(selected.size === sorted.length ? new Set() : new Set(sorted.map((p) => p.id)));
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    await Promise.all(Array.from(selected).map((id) => fetch(`/api/pages/${id}`, { method: "DELETE" })));
    setPages((prev) => prev.filter((p) => !selected.has(p.id)));
    setSelected(new Set());
    setShowBulkDelete(false);
    setBulkDeleting(false);
    router.refresh();
  };

  const handleDeleted = useCallback((id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
    router.refresh();
  }, [router]);

  const handleDuplicated = useCallback(() => { router.refresh(); }, [router]);

  if (pages.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-base">No pages yet. Create your first sales page!</p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Single toolbar row ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-5">

        {/* Status pills */}
        <div className="flex items-center gap-1 p-0.5 rounded-full border border-border bg-card shrink-0">
          {(["all", "published", "draft"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-2.5 py-0.5 rounded-full transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* User filter (only when multiple users) */}
        {hasMultipleUsers && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors shrink-0 ${
                  activeUser
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                <User className="h-3 w-3" />
                {activeUser ?? "User"}
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuItem onClick={() => setActiveUser(null)} className="gap-2 cursor-pointer">
                <span className="w-4 shrink-0">{activeUser === null && <Check className="h-3.5 w-3.5 text-primary" />}</span>
                All users
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {allUsers.map((u) => (
                <DropdownMenuItem key={u} onClick={() => setActiveUser(activeUser === u ? null : u)} className="gap-2 cursor-pointer">
                  <span className="w-4 shrink-0">{activeUser === u && <Check className="h-3.5 w-3.5 text-primary" />}</span>
                  {u}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Tag filter */}
        {allTags.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors shrink-0 ${
                  activeTag
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                <Tag className="h-3 w-3" />
                {activeTag ?? "Tag"}
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuItem onClick={() => setActiveTag(null)} className="gap-2 cursor-pointer">
                <span className="w-4 shrink-0">{activeTag === null && <Check className="h-3.5 w-3.5 text-primary" />}</span>
                All tags
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {allTags.map((tag) => (
                <DropdownMenuItem key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)} className="gap-2 cursor-pointer">
                  <span className="w-4 shrink-0">{activeTag === tag && <Check className="h-3.5 w-3.5 text-primary" />}</span>
                  {tag}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Clear filters */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X className="h-3 w-3" />
            Clear
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/15 text-primary text-[10px] font-semibold">
              {activeFilterCount}
            </span>
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        <div className="relative shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-40 pl-7 pr-6 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 focus:w-52 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        {pages.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted border border-border bg-card shrink-0">
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{currentSortLabel}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuItem key={option.value} onClick={() => setSort(option.value)} className="gap-2 cursor-pointer">
                  <span className="w-4 shrink-0">
                    {sort === option.value && <Check className="h-3.5 w-3.5 text-primary" />}
                  </span>
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* View toggle */}
        <div className="flex items-center border border-border rounded-lg overflow-hidden bg-card shrink-0">
          <button onClick={() => setViewMode("card")} title="Card view"
            className={`p-1.5 transition-colors ${view === "card" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button onClick={() => setViewMode("list")} title="List view"
            className={`p-1.5 transition-colors ${view === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Empty state ──────────────────────────────────────────────── */}
      {sorted.length === 0 && (
        <div className="text-center py-16">
          <SlidersHorizontal className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm font-medium">No pages match your filters</p>
          <button onClick={clearAllFilters} className="mt-2 text-sm text-primary hover:underline">
            Clear all filters
          </button>
        </div>
      )}

      {/* ── Card view ────────────────────────────────────────────────── */}
      {view === "card" && sorted.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map((page) => (
            <PageCard key={page.id} page={page} analytics={analyticsMap[page.id]} />
          ))}
        </div>
      )}

      {/* ── List view ────────────────────────────────────────────────── */}
      {view === "list" && sorted.length > 0 && (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-muted/30">
            <input
              type="checkbox"
              checked={selected.size === sorted.length && sorted.length > 0}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-border accent-primary cursor-pointer shrink-0"
            />
            <span className="w-2 hidden sm:block shrink-0" />
            <span className="flex-1 text-xs font-medium text-muted-foreground">Page</span>
            <span className="hidden lg:flex text-xs font-medium text-muted-foreground shrink-0 w-40">Tags</span>
            <span className="hidden md:flex text-xs font-medium text-muted-foreground shrink-0 w-[7.5rem] justify-end pr-1">Views</span>
            <span className="text-xs font-medium text-muted-foreground shrink-0 hidden sm:block w-20 text-center">Status</span>
            <span className="text-xs font-medium text-muted-foreground shrink-0 w-6 hidden sm:block" />
            <span className="w-[4.75rem] shrink-0" />
          </div>
          {sorted.map((page) => (
            <PageListRow
              key={page.id}
              page={page}
              analytics={analyticsMap[page.id]}
              selected={selected.has(page.id)}
              onToggleSelect={() => toggleSelect(page.id)}
              onDeleted={() => handleDeleted(page.id)}
              onDuplicated={handleDuplicated}
            />
          ))}
        </div>
      )}

      {/* ── Floating bulk bar ─────────────────────────────────────────── */}
      {selected.size > 0 && view === "list" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border bg-card shadow-xl">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="h-4 w-px bg-border" />
          <Button variant="destructive" size="sm" className="h-7 text-xs gap-1.5" onClick={() => setShowBulkDelete(true)}>
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
          <button onClick={() => setSelected(new Set())} className="text-muted-foreground hover:text-foreground transition-colors" title="Clear selection">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Bulk delete dialog ────────────────────────────────────────── */}
      <AlertDialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} page{selected.size !== 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selected.size === 1 ? "this page" : `these ${selected.size} pages`} and all their content. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={bulkDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {bulkDeleting ? "Deleting…" : `Delete ${selected.size} page${selected.size !== 1 ? "s" : ""}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
