"use client";

import {
  useState,
  useEffect,
  useCallback,
  KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/api-client";
import type { TemplateData } from "@/types";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { SectionLabel } from "@/components/ui/section-label";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "post-call", label: "Post-Call" },
  { value: "proposal", label: "Proposals" },
  { value: "deal-room", label: "Deal Rooms" },
  { value: "onboarding", label: "Onboarding" },
];

interface TemplatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBlank: () => void;
}

export function TemplatePicker({
  isOpen,
  onClose,
  onCreateBlank,
}: TemplatePickerProps) {
  const router = useRouter();

  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);

  // Fetch templates when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setLoadingTemplates(true);
    apiClient.get<TemplateData[]>("/api/templates")
      .then((data) => {
        setTemplates(data);
        setLoadingTemplates(false);
      })
      .catch(() => {
        toast.error("Failed to load templates");
        setLoadingTemplates(false);
      });
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory("all");
      setSelectedTemplateId(null);
      setIsCreating(false);
      setLimitError(null);
    }
  }, [isOpen]);

  const filteredTemplates =
    selectedCategory === "all"
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  const handleUseSpecificTemplate = useCallback(
    async (templateId: string) => {
      if (isCreating) return;
      setIsCreating(true);
      setSelectedTemplateId(templateId);
      try {
        const data = await apiClient.post<{ pageId: string }>("/api/pages/from-template", { templateId });
        router.push(`/editor/${data.pageId}`);
      } catch (err) {
        if (err instanceof ApiError && err.code === "PLAN_LIMIT") {
          setLimitError(err.message);
        } else {
          toast.error(err instanceof ApiError ? err.message : "Failed to create page from template");
        }
        setIsCreating(false);
      }
    },
    [isCreating, router]
  );

  const handleUseSelected = () => {
    if (selectedTemplateId) handleUseSpecificTemplate(selectedTemplateId);
  };

  // Keyboard navigation: Arrow keys move selection, Enter confirms.
  // Escape is handled natively by the Dialog primitive.
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (!filteredTemplates.length) return;

      const currentIndex = filteredTemplates.findIndex(
        (t) => t.id === selectedTemplateId
      );

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const next =
          currentIndex < filteredTemplates.length - 1
            ? currentIndex + 1
            : 0;
        setSelectedTemplateId(filteredTemplates[next].id);
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prev =
          currentIndex > 0 ? currentIndex - 1 : filteredTemplates.length - 1;
        setSelectedTemplateId(filteredTemplates[prev].id);
        return;
      }
      if (e.key === "Enter" && selectedTemplateId) {
        handleUseSelected();
      }
    },
    [filteredTemplates, selectedTemplateId, handleUseSelected] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        onKeyDown={handleKeyDown}
        className="sm:max-w-4xl max-h-[88vh] flex flex-col gap-0 overflow-hidden p-0"
      >
        {/* ── Header ── */}
        <DialogHeader className="px-6 py-5 border-b border-border shrink-0 text-left">
          <DialogTitle className="font-display text-title text-foreground">
            Choose a template
          </DialogTitle>
          <DialogDescription className="text-small text-muted-foreground mt-0.5">
            Start from a proven layout, or begin with a blank page.
          </DialogDescription>
        </DialogHeader>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left sidebar */}
          <aside className="w-48 shrink-0 border-r border-border p-3 flex flex-col gap-0.5 overflow-y-auto">
            <SectionLabel className="px-2 mb-1.5">
              Templates
            </SectionLabel>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => {
                  setSelectedCategory(cat.value);
                  setSelectedTemplateId(null);
                }}
                className={`w-full text-small text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedCategory === cat.value
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            ))}

            {/* Blank page — always pinned to the bottom */}
            <div className="mt-auto pt-3 border-t border-border">
              <button
                onClick={onCreateBlank}
                className="w-full text-small text-left px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-2"
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                Blank page
              </button>
            </div>
          </aside>

          {/* Template grid */}
          <div className="flex-1 overflow-y-auto p-5">
            {loadingTemplates ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                No templates in this category yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredTemplates.map((template) => {
                  const isSelected = template.id === selectedTemplateId;
                  return (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isSelected={isSelected}
                      isCreating={isCreating && isSelected}
                      onClick={() => setSelectedTemplateId(template.id)}
                      onUse={() => handleUseSpecificTemplate(template.id)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Limit error ── */}
        {limitError && (
          <div className="px-6 py-0">
            <UpgradePrompt message={limitError} className="rounded-none border-x-0 border-b-0" />
          </div>
        )}

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0">
          <p className="text-2xs text-tertiary">
            {selectedTemplateId
              ? `"${templates.find((t) => t.id === selectedTemplateId)?.name}" selected · press Enter to open`
              : "Select a template, or use ↑ ↓ arrow keys"}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUseSelected}
              disabled={!selectedTemplateId || isCreating}
              className="gap-2 min-w-[150px]"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating page…
                </>
              ) : (
                "Use this template"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// TemplateCard
// ---------------------------------------------------------------------------
interface TemplateCardProps {
  template: TemplateData;
  isSelected: boolean;
  isCreating: boolean;
  onClick: () => void;
  onUse: () => void;
}

function TemplateCard({
  template,
  isSelected,
  isCreating,
  onClick,
  onUse,
}: TemplateCardProps) {
  const tabCount = (() => {
    try {
      const tabs = JSON.parse(template.tabs) as Array<{ label: string }>;
      return tabs.length;
    } catch {
      return 0;
    }
  })();

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={onClick}
      onDoubleClick={onUse}
      onKeyDown={(e) => {
        if (e.key === "Enter") onUse();
      }}
      className={`p-4 rounded-xl border cursor-pointer transition-all select-none ${
        isSelected
          ? "border-foreground bg-muted shadow-elevation-1"
          : "border-border hover:border-border-strong hover:shadow-elevation-1 bg-card"
      }`}
    >
      {/* Monochrome icon tile */}
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card text-2xl leading-none grayscale">
        {template.icon}
      </div>

      {/* Name */}
      <h3 className="font-semibold text-foreground text-small mb-1">
        {template.name}
      </h3>

      {/* Description */}
      <p className="text-2xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
        {template.description}
      </p>

      {/* Footer row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-3xs text-muted-foreground">
            {template.usageCount === 0
              ? "New"
              : `Used ${template.usageCount}×`}
          </span>
          {tabCount > 1 && (
            <span className="text-3xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {tabCount} tabs
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onUse();
          }}
          disabled={isCreating}
          className="text-xs text-primary font-medium hover:underline disabled:opacity-50 transition-opacity"
        >
          {isCreating ? (
            <Loader2 className="h-3 w-3 animate-spin inline" />
          ) : (
            "Use →"
          )}
        </button>
      </div>
    </div>
  );
}
