"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  MoreHorizontal,
  RotateCcw,
  Trophy,
  X,
} from "lucide-react";

import { apiClient, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { formatStageAge, isOverdue } from "@/lib/deals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { DealPulse, formatCloseDate } from "@/components/deals/deal-card";
import { MemberPicker } from "@/components/deals/member-picker";
import { CompanyPicker } from "@/components/deals/company-picker";
import { DealRoomsCard } from "@/components/deals/deal-rooms-card";
import { DealStakeholdersCard } from "@/components/deals/deal-stakeholders-card";
import { DealMapCard } from "@/components/deals/deal-map-card";
import { DealCommentsCard } from "@/components/deals/deal-comments-card";
import type {
  CompanyOption,
  DealDetailData,
  DealOwnerData,
  PipelineStageData,
} from "@/types";

interface DealDetailProps {
  deal: DealDetailData;
  members: DealOwnerData[];
  stages: PipelineStageData[];
  /** Companies to pick from; the picker can also create one inline. */
  companies: CompanyOption[];
  currentUserId: string;
  /** Viewer can delete anyone's comment (deal owner or team OWNER). */
  canModerate: boolean;
}

type DealPatch = Partial<{
  name: string;
  companyId: string | null;
  value: number | null;
  stageId: string;
  status: "OPEN" | "WON" | "LOST";
  expectedCloseDate: string | null;
  ownerId: string;
}>;

export function DealDetail({
  deal,
  members,
  stages,
  companies: initialCompanies,
  currentUserId,
  canModerate,
}: DealDetailProps) {
  const router = useRouter();
  const [name, setName] = useState(deal.name);
  const [valueText, setValueText] = useState(
    deal.value !== null ? String(deal.value) : ""
  );
  // Local copy so a company created from the picker appears immediately.
  const [companies, setCompanies] = useState(initialCompanies);
  const nameRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef<HTMLInputElement>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Refreshed server data wins unless the rep is mid-edit in that field —
  // otherwise a stale field blurred after a teammate's edit would silently
  // PATCH the old text back over their change.
  useEffect(() => {
    if (document.activeElement !== nameRef.current) setName(deal.name);
  }, [deal.name]);
  useEffect(() => {
    if (document.activeElement !== valueRef.current) {
      setValueText(deal.value !== null ? String(deal.value) : "");
    }
  }, [deal.value]);

  const resetFields = () => {
    if (document.activeElement !== nameRef.current) setName(deal.name);
    if (document.activeElement !== valueRef.current) {
      setValueText(deal.value !== null ? String(deal.value) : "");
    }
  };

  const patch = async (data: DealPatch, successMessage?: string) => {
    try {
      await apiClient.patch(`/api/deals/${deal.id}`, data);
      if (successMessage) toast.success(successMessage);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update deal");
      // Drop rejected input so the field doesn't keep re-sending it on blur.
      resetFields();
      router.refresh();
    }
  };

  const commitName = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(deal.name);
      return;
    }
    if (trimmed !== deal.name) patch({ name: trimmed });
  };

  const commitValue = () => {
    const trimmed = valueText.trim();
    if (trimmed === "") {
      if (deal.value !== null) patch({ value: null });
      return;
    }
    const parsed = Number(trimmed.replace(/[$,\s]/g, ""));
    if (!Number.isFinite(parsed) || parsed < 0) {
      setValueText(deal.value !== null ? String(deal.value) : "");
      toast.error("Enter the deal value as a plain number");
      return;
    }
    if (Math.round(parsed) !== deal.value) patch({ value: Math.round(parsed) });
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiClient.delete(`/api/deals/${deal.id}`);
      toast.success("Deal deleted — its rooms are untouched");
      router.push("/deals");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete deal");
      setDeleting(false);
    }
  };

  const isOpen = deal.status === "OPEN";

  return (
    <div>
      <Link
        href="/deals"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Deals
      </Link>

      {/* ── Header ── */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            aria-label="Deal name"
            className="-mx-1 w-full max-w-xl rounded-lg bg-transparent px-1 font-display text-display text-foreground transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
          />
          <div className="mt-0.5 max-w-xs">
            <CompanyPicker
              variant="inline"
              placeholder="Add company"
              companies={companies}
              value={deal.company}
              onChange={(next) => patch({ companyId: next?.id ?? null })}
              onCompanyCreated={(created) =>
                setCompanies((prev) =>
                  [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
                )
              }
            />
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <DealPulse deal={deal} />
            {!isOpen && deal.closedAt && (
              <span className="text-2xs text-muted-foreground">
                Closed {formatCloseDate(deal.closedAt)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOpen ? (
            <>
              <Button variant="outline" size="sm" onClick={() => patch({ status: "LOST" }, "Deal marked lost")}>
                <X />
                Mark lost
              </Button>
              <Button size="sm" onClick={() => patch({ status: "WON" }, "Deal marked won 🎉")}>
                <Trophy />
                Mark won
              </Button>
            </>
          ) : (
            <>
              <Badge variant={deal.status === "WON" ? "success" : "neutral"}>
                {deal.status === "WON" ? "Won" : "Lost"}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => patch({ status: "OPEN" }, "Deal reopened")}>
                <RotateCcw />
                Reopen
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton aria-label="Deal actions" size="sm">
                <MoreHorizontal />
              </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                Delete deal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Meta fields ── */}
      <div className="mt-5 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <span className="block text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
            Stage
          </span>
          {isOpen ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {deal.stage.name}
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {stages.map((s) => (
                  <DropdownMenuItem key={s.id} onClick={() => patch({ stageId: s.id })}>
                    <span className="w-4">
                      {s.id === deal.stage.id && <Check className="h-3.5 w-3.5" />}
                    </span>
                    {s.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex h-9 items-center px-0.5 text-sm text-muted-foreground">
              {deal.stage.name}
            </div>
          )}
          {isOpen && (
            <p className="text-2xs text-muted-foreground">
              In this stage {formatStageAge(deal.stageEnteredAt)}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="deal-detail-value"
            className="block text-2xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Value (USD)
          </label>
          <input
            id="deal-detail-value"
            ref={valueRef}
            value={valueText}
            onChange={(e) => setValueText(e.target.value.replace(/[^0-9]/g, ""))}
            onBlur={commitValue}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            placeholder="—"
            inputMode="numeric"
            className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm tabular-nums text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <span className="block text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
            Expected close
          </span>
          <DatePicker
            value={deal.expectedCloseDate ? new Date(deal.expectedCloseDate) : null}
            onChange={(date) =>
              patch({ expectedCloseDate: date ? date.toISOString() : null })
            }
            placeholder="Pick a date"
            className={cn(
              "w-full",
              isOverdue(deal) && "border-destructive/50 text-destructive"
            )}
          />
        </div>

        <div className="space-y-1.5">
          <span className="block text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
            Owner
          </span>
          <MemberPicker
            members={members}
            value={deal.owner.id}
            fallback={deal.owner}
            onChange={(ownerId) => patch({ ownerId })}
          />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <DealRoomsCard deal={deal} onChanged={() => router.refresh()} />
          <DealMapCard actionPlans={deal.actionPlans} />
        </div>
        <div className="space-y-5">
          <DealStakeholdersCard deal={deal} onChanged={() => router.refresh()} />
          <DealCommentsCard
            dealId={deal.id}
            comments={deal.comments}
            currentUserId={currentUserId}
            canModerate={canModerate}
            onChanged={() => router.refresh()}
          />
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this deal?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deal.name}&rdquo; and its stakeholder list will be deleted.
              Linked rooms are kept — they just come off the deal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete deal"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
