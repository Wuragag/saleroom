"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  Circle,
  Globe,
  EyeOff,
  MoreHorizontal,
  BookmarkPlus,
  CheckCircle2,
  Lock,
  Unlock,
  Users,
  EyeOff as EyeOffIcon,
  Trash2,
  Share2,
  Mail,
  Palette,
} from "lucide-react";
import { ShareModal } from "@/components/share-modal";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { StylePanel } from "./style-panel";
import type { PageStyle } from "@/lib/page-styles";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/api-client";

const TEMPLATE_CATEGORIES = [
  { value: "post-call", label: "Post-Call" },
  { value: "proposal", label: "Proposal" },
  { value: "deal-room", label: "Deal Room" },
  { value: "onboarding", label: "Onboarding" },
];

interface EditorHeaderProps {
  title: string;
  slug: string;
  pageId: string;
  published: boolean;
  onPublishedChange: (published: boolean) => void;
  saveStatus: "saved" | "saving" | "unsaved";
  onForceSave: () => Promise<void>;
  readOnly?: boolean;
  lockedByName?: string;
  isLocked?: boolean;
  onLockChange?: (locked: boolean) => void;
  visibility?: "TEAM" | "PRIVATE";
  onVisibilityChange?: (visibility: "TEAM" | "PRIVATE") => void;
  isCreator?: boolean;
  requireEmail?: boolean;
  onRequireEmailChange?: (requireEmail: boolean) => void;
  /** Design popover — page style controls shown on the WYSIWYG canvas */
  pageStyle?: PageStyle;
  onStyleChange?: (patch: Partial<PageStyle>) => void;
  password?: string;
  onPasswordChange?: (value: string) => void;
  passwordProtection?: boolean;
}

export function EditorHeader({
  title,
  slug,
  pageId,
  published,
  onPublishedChange,
  saveStatus,
  onForceSave,
  readOnly,
  lockedByName,
  isLocked,
  onLockChange,
  visibility,
  onVisibilityChange,
  isCreator,
  requireEmail,
  onRequireEmailChange,
  pageStyle,
  onStyleChange,
  password,
  onPasswordChange,
  passwordProtection,
}: EditorHeaderProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lockLoading, setLockLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Share modal state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [justPublished, setJustPublished] = useState(false);

  // Save as Template modal state
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateCategory, setTemplateCategory] = useState("post-call");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear copy timer on unmount
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const pageUrl = `/p/${slug}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${pageUrl}`
      );
    } catch {
      return; // Clipboard API not available
    }
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId, type: "share" }),
    });
  };

  const handlePreview = async () => {
    await onForceSave();
    window.open(`/preview/${pageId}`, "_blank");
  };

  const handleTogglePublish = async () => {
    setPublishing(true);
    try {
      await onForceSave();
      const next = !published;
      await apiClient.put(`/api/pages/${pageId}`, { published: next });
      onPublishedChange(next);
      if (next) {
        setJustPublished(true);
        setTimeout(() => setJustPublished(false), 1500);
      }
      toast.success(next ? "Page published" : "Page unpublished");
    } catch {
      toast.error("Failed to update publish status");
    } finally {
      setPublishing(false);
    }
  };

  const openSaveAsTemplate = () => {
    setTemplateName(title || "My Template");
    setTemplateDescription("");
    setTemplateCategory("post-call");
    setSaveSuccess(false);
    setTemplateModalOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || isSaving) return;
    setIsSaving(true);
    try {
      await apiClient.post("/api/templates", {
        name: templateName.trim(),
        description: templateDescription.trim(),
        category: templateCategory,
        pageId,
      });
      setSaveSuccess(true);
      // Auto-close after showing success
      setTimeout(() => {
        setTemplateModalOpen(false);
        setSaveSuccess(false);
      }, 1800);
    } catch {
      toast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLockToggle = async () => {
    setLockLoading(true);
    try {
      await apiClient.post(`/api/pages/${pageId}/lock`, { locked: !isLocked });
      onLockChange?.(!isLocked);
      toast.success(!isLocked ? "Page locked" : "Page unlocked");
    } catch {
      toast.error("Failed to update lock status");
    } finally {
      setLockLoading(false);
    }
  };

  const handleVisibilityChange = async (newVisibility: "TEAM" | "PRIVATE") => {
    try {
      await apiClient.put(`/api/pages/${pageId}`, { visibility: newVisibility });
      onVisibilityChange?.(newVisibility);
      toast.success(newVisibility === "PRIVATE" ? "Page set to private" : "Page visible to team");
    } catch {
      toast.error("Failed to change visibility");
    }
  };

  const handleRequireEmailToggle = async () => {
    const next = !requireEmail;
    try {
      await apiClient.put(`/api/pages/${pageId}`, { requireEmail: next });
      onRequireEmailChange?.(next);
      toast.success(next ? "Email gate enabled" : "Email gate disabled");
    } catch {
      toast.error("Failed to update email gate setting");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiClient.delete(`/api/pages/${pageId}`);
      toast.success("Page deleted");
      router.push("/");
    } catch {
      toast.error("Failed to delete page");
      setDeleting(false);
    }
  };

  return (
    <>
      <header className="border-b border-border bg-background">
        <div className="px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Left: back, badge, save status */}
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-lg gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <Badge
                variant={published ? "default" : "secondary"}
                className="text-3xs px-2 py-0.5 rounded-full"
              >
                {published ? "Published" : "Draft"}
              </Badge>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Circle
                  className={`h-2 w-2 fill-current transition-all duration-300 ${
                    saveStatus === "saved"
                      ? "text-success animate-save-dot"
                      : saveStatus === "saving"
                      ? "text-warning animate-spin"
                      : "text-warning"
                  }`}
                  style={saveStatus === "saving" ? { animationDuration: "1s" } : undefined}
                />
                <span
                  className={`transition-all duration-200 ${
                    saveStatus === "saved"
                      ? "text-success font-medium"
                      : saveStatus === "unsaved"
                      ? "text-warning font-medium"
                      : ""
                  }`}
                >
                  {saveStatus === "saved"
                    ? "Saved"
                    : saveStatus === "saving"
                    ? "Saving..."
                    : "Unsaved"}
                </span>
              </div>

              {/* Lock indicator */}
              {lockedByName && (
                <Badge variant="outline" className="text-3xs px-2 py-0.5 rounded-full gap-1 text-warning border-warning/30">
                  <Lock className="h-2.5 w-2.5" />
                  Locked by {lockedByName}
                </Badge>
              )}

              {/* Visibility badge */}
              {visibility === "PRIVATE" && (
                <Badge variant="outline" className="text-3xs px-2 py-0.5 rounded-full gap-1">
                  <EyeOffIcon className="h-2.5 w-2.5" />
                  Private
                </Badge>
              )}
            </div>

            {/* Right: actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Design popover — page style controls */}
              {!readOnly && pageStyle && onStyleChange && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg gap-1.5"
                      aria-label="Design"
                    >
                      <Palette className="h-3 w-3" />
                      <span className="hidden sm:inline">Design</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className="w-72 p-0 max-h-[75vh] overflow-y-auto"
                  >
                    <StylePanel
                      style={pageStyle}
                      onChange={onStyleChange}
                      password={password ?? ""}
                      onPasswordChange={onPasswordChange ?? (() => {})}
                      passwordProtection={passwordProtection}
                    />
                  </PopoverContent>
                </Popover>
              )}
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg gap-1.5"
                onClick={handlePreview}
                aria-label="Preview"
              >
                <ExternalLink className="h-3 w-3" />
                <span className="hidden sm:inline">Preview</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`rounded-lg gap-1.5 transition-all duration-200 ${copied ? "bg-success-subtle border-success/30 text-success-subtle-foreground animate-success-pulse" : ""}`}
                onClick={copyLink}
                aria-label="Copy link"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 animate-dopamine-bounce" />
                    <span className="hidden sm:inline">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span className="hidden sm:inline">Copy Link</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg gap-1.5"
                onClick={() => setShareModalOpen(true)}
                aria-label="Share"
              >
                <Share2 className="h-3 w-3" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              <div className="relative">
                <Button
                  size="sm"
                  variant={published ? "outline" : "default"}
                  className={`rounded-lg gap-1.5 transition-all duration-200 ${
                    justPublished ? "animate-success-pulse bg-success hover:bg-success text-success-foreground" : ""
                  }`}
                  onClick={handleTogglePublish}
                  disabled={publishing}
                  aria-label={published ? "Unpublish page" : "Publish page"}
                >
                  {justPublished ? (
                    <>
                      <Check className="h-3 w-3 animate-dopamine-bounce" />
                      <span className="hidden sm:inline">Published!</span>
                    </>
                  ) : published ? (
                    <>
                      <EyeOff className="h-3 w-3" />
                      <span className="hidden sm:inline">{publishing ? "Unpublishing..." : "Unpublish"}</span>
                    </>
                  ) : (
                    <>
                      <Globe className="h-3 w-3" />
                      <span className="hidden sm:inline">{publishing ? "Publishing..." : "Publish"}</span>
                    </>
                  )}
                </Button>
                {justPublished && (
                  <span className="absolute inset-0 rounded-lg animate-celebrate-ring text-success pointer-events-none" />
                )}
              </div>

              {/* ··· overflow menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-lg px-2 text-muted-foreground hover:text-foreground"
                    aria-label="More options"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {/* Lock toggle */}
                  {!readOnly && (
                    <DropdownMenuItem
                      onClick={handleLockToggle}
                      disabled={lockLoading}
                      className="gap-2 cursor-pointer"
                    >
                      {isLocked ? (
                        <>
                          <Unlock className="h-4 w-4" />
                          Unlock Page
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          Lock Page
                        </>
                      )}
                    </DropdownMenuItem>
                  )}

                  {/* Visibility toggle — only for creator */}
                  {isCreator && (
                    <DropdownMenuItem
                      onClick={() =>
                        handleVisibilityChange(
                          visibility === "PRIVATE" ? "TEAM" : "PRIVATE"
                        )
                      }
                      className="gap-2 cursor-pointer"
                    >
                      {visibility === "PRIVATE" ? (
                        <>
                          <Users className="h-4 w-4" />
                          Make Team Visible
                        </>
                      ) : (
                        <>
                          <EyeOffIcon className="h-4 w-4" />
                          Make Private
                        </>
                      )}
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onClick={handleRequireEmailToggle}
                    className="gap-2 cursor-pointer"
                  >
                    <Mail className="h-4 w-4" />
                    {requireEmail ? "Disable Email Gate" : "Require Email to View"}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={openSaveAsTemplate}
                    className="gap-2 cursor-pointer"
                  >
                    <BookmarkPlus className="h-4 w-4" />
                    Save as Template
                  </DropdownMenuItem>

                  {/* Delete — only for creator */}
                  {isCreator && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Page
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* ── Delete Confirmation Dialog ── */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{title || "Untitled Page"}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this page and all its content. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Share Modal ── */}
      <ShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        pageId={pageId}
        slug={slug}
        pageTitle={title || "Untitled Page"}
      />

      {/* ── Save as Template Dialog ── */}
      <Dialog open={templateModalOpen} onOpenChange={setTemplateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
          </DialogHeader>

          {saveSuccess ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="relative">
                <CheckCircle2 className="h-10 w-10 text-success animate-dopamine-bounce" />
                <span className="absolute inset-0 rounded-full animate-celebrate-ring text-success pointer-events-none" />
              </div>
              <p className="text-sm font-medium text-foreground animate-slide-up">
                Template saved!
              </p>
              <p className="text-xs text-muted-foreground text-center animate-slide-up" style={{ animationDelay: "0.1s" }}>
                Find it in <strong>New Page</strong> when you next create a
                page.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 py-2">
              {/* Template name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-foreground">
                  Template name
                </label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. My Call Recap"
                  className="rounded-lg"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTemplate();
                  }}
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-foreground">
                  Description{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>
                <Input
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="What is this template for?"
                  className="rounded-lg"
                />
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-foreground">
                  Category
                </label>
                <select
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {TEMPLATE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => setTemplateModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="rounded-lg gap-2"
                  onClick={handleSaveTemplate}
                  disabled={!templateName.trim() || isSaving}
                >
                  {isSaving ? "Saving…" : "Save Template"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
