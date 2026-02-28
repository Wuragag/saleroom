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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

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
}: EditorHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Save as Template modal state
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateCategory, setTemplateCategory] = useState("post-call");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const pageUrl = `/p/${slug}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(
      `${window.location.origin}${pageUrl}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      await fetch(`/api/pages/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: next }),
      });
      onPublishedChange(next);
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
      await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName.trim(),
          description: templateDescription.trim(),
          category: templateCategory,
          pageId,
        }),
      });
      setSaveSuccess(true);
      // Auto-close after showing success
      setTimeout(() => {
        setTemplateModalOpen(false);
        setSaveSuccess(false);
      }, 1800);
    } finally {
      setIsSaving(false);
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
                  <DropdownMenuItem
                    onClick={openSaveAsTemplate}
                    className="gap-2 cursor-pointer"
                  >
                    <BookmarkPlus className="h-4 w-4" />
                    Save as Template
                  </DropdownMenuItem>
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
            className="mt-3 w-full text-2xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground text-foreground"
          />
        </div>
      </header>

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
