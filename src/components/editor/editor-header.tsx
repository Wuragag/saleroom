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
} from "lucide-react";
import { ShareModal } from "@/components/share-modal";
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
  onTitleChange: (title: string) => void;
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
}

export function EditorHeader({
  title,
  onTitleChange,
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
}: EditorHeaderProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lockLoading, setLockLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Share modal state
  const [shareModalOpen, setShareModalOpen] = useState(false);

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
          <div className="flex items-center justify-between gap-4">
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
                className="text-[10px] px-2 py-0.5 rounded-full"
              >
                {published ? "Published" : "Draft"}
              </Badge>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Circle
                  className={`h-2 w-2 fill-current ${
                    saveStatus === "saved"
                      ? "text-emerald-500"
                      : saveStatus === "saving"
                      ? "text-amber-500"
                      : "text-muted-foreground/50"
                  }`}
                />
                {saveStatus === "saved"
                  ? "Saved"
                  : saveStatus === "saving"
                  ? "Saving..."
                  : "Unsaved"}
              </div>

              {/* Lock indicator */}
              {lockedByName && (
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full gap-1 text-amber-600 border-amber-200 dark:border-amber-800">
                  <Lock className="h-2.5 w-2.5" />
                  Locked by {lockedByName}
                </Badge>
              )}

              {/* Visibility badge */}
              {visibility === "PRIVATE" && (
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full gap-1">
                  <EyeOffIcon className="h-2.5 w-2.5" />
                  Private
                </Badge>
              )}
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg gap-1.5"
                onClick={handlePreview}
              >
                <ExternalLink className="h-3 w-3" />
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg gap-1.5"
                onClick={copyLink}
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy Link
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg gap-1.5"
                onClick={() => setShareModalOpen(true)}
              >
                <Share2 className="h-3 w-3" />
                Share
              </Button>
              <Button
                size="sm"
                variant={published ? "outline" : "default"}
                className="rounded-lg gap-1.5"
                onClick={handleTogglePublish}
                disabled={publishing}
              >
                {published ? (
                  <>
                    <EyeOff className="h-3 w-3" />
                    {publishing ? "Unpublishing..." : "Unpublish"}
                  </>
                ) : (
                  <>
                    <Globe className="h-3 w-3" />
                    {publishing ? "Publishing..." : "Publish"}
                  </>
                )}
              </Button>

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

          {/* Title input */}
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Untitled Page"
            readOnly={readOnly}
            className="mt-3 w-full text-2xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground text-foreground"
          />
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
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <p className="text-sm font-medium text-foreground">
                Template saved!
              </p>
              <p className="text-xs text-muted-foreground text-center">
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
