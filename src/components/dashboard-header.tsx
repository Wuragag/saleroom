"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { TemplatePicker } from "@/components/template-picker";
import { ImportDocumentModal } from "@/components/import-document-modal";
import { UpgradePrompt } from "@/components/upgrade-prompt";

export function DashboardHeader() {
  const router = useRouter();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
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
            variant="outline"
            size="sm"
            className="rounded-lg gap-1.5 shrink-0"
            onClick={() => setIsImportOpen(true)}
          >
            <Upload className="h-3.5 w-3.5" />
            Import
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
    </>
  );
}
