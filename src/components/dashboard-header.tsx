"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, PenLine } from "lucide-react";
import { TemplatePicker } from "@/components/template-picker";
import { ImportDocumentModal } from "@/components/import-document-modal";
import { AiWriteModal } from "@/components/ai-write-modal";
import { UpgradePrompt } from "@/components/upgrade-prompt";

export function DashboardHeader() {
  const router = useRouter();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAiWriteOpen, setIsAiWriteOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);

  const createBlankPage = async () => {
    setIsCreating(true);
    setIsPickerOpen(false);
    setLimitError(null);
    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "PLAN_LIMIT") {
          setLimitError(data.error);
          return;
        }
        return;
      }
      router.push(`/editor/${data.id}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Your Pages
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Create, manage and share your sales pages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="rounded-lg gap-1.5 shrink-0 bg-gradient-to-r from-[#003B22] to-[#0d9488] hover:from-[#004d2d] hover:to-[#0f766e] text-white border-0 shadow-sm hover:shadow-md transition-all duration-200 dark:from-[#0d7a5f] dark:to-[#14b8a6] dark:hover:from-[#0fa97c] dark:hover:to-[#2dd4bf]"
            onClick={() => setIsImportOpen(true)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Import
          </Button>
          <Button
            size="sm"
            className="rounded-lg gap-1.5 shrink-0 bg-gradient-to-r from-[#003B22] to-[#0d9488] hover:from-[#004d2d] hover:to-[#0f766e] text-white border-0 shadow-sm hover:shadow-md transition-all duration-200 dark:from-[#0d7a5f] dark:to-[#14b8a6] dark:hover:from-[#0fa97c] dark:hover:to-[#2dd4bf]"
            onClick={() => setIsAiWriteOpen(true)}
          >
            <PenLine className="h-3.5 w-3.5" />
            AI Write
          </Button>
          <Button
            size="sm"
            className="rounded-lg gap-1.5 shrink-0"
            onClick={() => setIsPickerOpen(true)}
            disabled={isCreating}
          >
            <Plus className="h-3.5 w-3.5" />
            {isCreating ? "Creating…" : "New Page"}
          </Button>
        </div>
      </div>

      {limitError && (
        <UpgradePrompt message={limitError} className="mt-4" />
      )}

      <TemplatePicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onCreateBlank={createBlankPage}
      />

      <ImportDocumentModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
      />

      <AiWriteModal
        isOpen={isAiWriteOpen}
        onClose={() => setIsAiWriteOpen(false)}
      />
    </>
  );
}
