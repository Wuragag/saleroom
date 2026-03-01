"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TemplateData } from "@/types";
import { UpgradePrompt } from "@/components/upgrade-prompt";

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
  const modalRef = useRef<HTMLDivElement>(null);

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
    fetch("/api/templates")
      .then((r) => r.json())
      .then((data) => {
        setTemplates(data);
        setLoadingTemplates(false);
      })
      .catch(() => setLoadingTemplates(false));
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory("all");
      setSelectedTemplateId(null);
      setIsCreating(false);
      setLimitError(null);
      // Focus the modal so keyboard events work
      setTimeout(() => modalRef.current?.focus(), 50);
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
        const res = await fetch("/api/pages/from-template", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (data.code === "PLAN_LIMIT") {
            setLimitError(data.error);
            setIsCreating(false);
            return;
          }
          setIsCreating(false);
          return;
        }
        router.push(`/editor/${data.pageId}`);
      } catch {
        setIsCreating(false);
      }
    },
    [isCreating, router]
  );

  const handleUseSelected = () => {
    if (selectedTemplateId) handleUseSpecificTemplate(selectedTemplateId);
  };

  // Keyboard navigation: Arrow keys move selection, Enter confirms, Escape closes
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
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
    [filteredTemplates, selectedTemplateId, onClose, handleUseSelected] // eslint-disable-line react-hooks/exhaustive-deps
  );

  if (!isOpen) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Modal */}
      <div
        ref={modalRef}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="bg-background rounded-2xl shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden border border-border outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Choose a Template
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Start with a pre-built page or create from scratch
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left sidebar */}
          <aside className="w-48 shrink-0 border-r border-border p-3 flex flex-col gap-0.5 overflow-y-auto">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-1.5">
              Templates
            </p>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => {
                  setSelectedCategory(cat.value);
                  setSelectedTemplateId(null);
                }}
                className={`w-full text-sm text-left px-3 py-1.5 rounded-md transition-colors ${
                  selectedCategory === cat.value
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {cat.label}
              </button>
            ))}

            {/* Blank page — always pinned to the bottom */}
            <div className="mt-auto pt-3 border-t border-border">
              <button
                onClick={onCreateBlank}
                className="w-full text-sm text-left px-3 py-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-2"
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                Blank Page
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
          <p className="text-xs text-muted-foreground">
            {selectedTemplateId
              ? `"${templates.find((t) => t.id === selectedTemplateId)?.name}" selected · double-click or press Enter to open`
              : "Select a template to continue, or use ↑ ↓ arrow keys"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUseSelected}
              disabled={!selectedTemplateId || isCreating}
              className="rounded-lg gap-2 min-w-[160px]"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating page…
                </>
              ) : (
                "Use Selected Template"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
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
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${
        isSelected
          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
          : "border-border hover:border-primary/40 hover:shadow-sm bg-card"
      }`}
    >
      {/* Icon */}
      <div className="text-4xl mb-2.5 leading-none">{template.icon}</div>

      {/* Name */}
      <h3 className="font-semibold text-foreground text-sm mb-1">
        {template.name}
      </h3>

      {/* Description */}
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
        {template.description}
      </p>

      {/* Footer row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            {template.usageCount === 0
              ? "New"
              : `Used ${template.usageCount}×`}
          </span>
          {tabCount > 1 && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
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
