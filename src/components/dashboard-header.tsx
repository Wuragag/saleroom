"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Plus, PenLine, MoreHorizontal, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
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
        toast.error(data.error ?? "Failed to create page");
        return;
      }
      router.push(`/editor/${data.id}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      {/* ── Masthead ── */}
      <div className="relative rounded-xl border border-border bg-card shadow-elevation-1">
        {/* Engraving bleeds from the right, in its own clipped layer so the
            overflow menu can still escape the masthead. */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[58%] overflow-hidden rounded-r-xl">
          <Image
            src="/redesign/hero-dashboard.jpg"
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 58vw"
            className="hero-neg object-cover object-left opacity-90"
            style={{
              maskImage:
                "linear-gradient(to right, transparent 0%, black 55%)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, black 55%)",
            }}
          />
        </div>

        <div className="relative p-8">
          <SectionLabel>Workspace</SectionLabel>
          <h1 className="mt-1.5 font-display text-display text-foreground">
            Your pages
          </h1>
          <p className="mt-1 max-w-sm text-body text-muted-foreground">
            Build a page per deal, share one link, and watch how buyers engage.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setIsPickerOpen(true)}
              disabled={isCreating}
              data-tour="new-page"
            >
              <Plus className="h-4 w-4" />
              {isCreating ? "Creating…" : "New page"}
            </Button>
            <Button variant="ai" asChild data-tour="ai-write">
              <Link href="/ai">
                <PenLine className="h-4 w-4" />
                Create with AI
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {/* data-tour lives on the always-visible trigger — the tour
                    can't target items inside a closed menu. */}
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="More actions"
                  data-tour="ai-import"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => setIsImportOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" /> Import a document…
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {limitError && <UpgradePrompt message={limitError} className="mt-4" />}

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
