"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, ChevronDown } from "lucide-react";

import { apiClient, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { MemberPicker } from "@/components/deals/member-picker";
import type { DealOwnerData, PipelineStageData } from "@/types";

export interface CreateDealPrefill {
  /** Room to link to the new deal on creation. */
  pageId?: string;
  name?: string;
  /** ISO date — e.g. a linked room's MAP target close date. */
  closeDate?: string | null;
}

interface CreateDealDialogProps {
  isOpen: boolean;
  onClose: () => void;
  members: DealOwnerData[];
  /** The scope's pipeline columns; the first is the default stage. */
  stages: PipelineStageData[];
  currentUserId: string;
  prefill?: CreateDealPrefill;
  /** Called with the new deal id after a successful create. */
  onCreated: (dealId: string) => void;
}

export function CreateDealDialog({
  isOpen,
  onClose,
  members,
  stages,
  currentUserId,
  prefill,
  onCreated,
}: CreateDealDialogProps) {
  const [name, setName] = useState(prefill?.name ?? "");
  const [company, setCompany] = useState("");
  const [value, setValue] = useState("");
  const [stageId, setStageId] = useState<string | undefined>(stages[0]?.id);
  const [closeDate, setCloseDate] = useState<Date | null>(
    prefill?.closeDate ? new Date(prefill.closeDate) : null
  );
  const [ownerId, setOwnerId] = useState(currentUserId);
  const [saving, setSaving] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    setLimitError(null);
    try {
      // The input only admits digits, so this is already a plain number.
      const parsedValue = value === "" ? null : Number(value);
      if (parsedValue !== null && (!Number.isFinite(parsedValue) || parsedValue < 0)) {
        toast.error("Enter the deal value as a plain number");
        return;
      }
      const deal = await apiClient.post<{ id: string }>("/api/deals", {
        name: name.trim(),
        company: company.trim(),
        value: parsedValue,
        stageId,
        expectedCloseDate: closeDate ? closeDate.toISOString() : null,
        // Empty when the caller has no member context — server defaults to the
        // session user.
        ownerId: ownerId || undefined,
        pageId: prefill?.pageId,
      });
      toast.success("Deal created");
      onCreated(deal.id);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.code === "PLAN_LIMIT") {
        setLimitError(err.message);
      } else {
        toast.error(err instanceof ApiError ? err.message : "Failed to create deal");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New deal</DialogTitle>
          <DialogDescription>
            {prefill?.pageId
              ? "The room will be linked to this deal."
              : "Track a deal in your pipeline — link rooms to it any time."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="deal-name" className="text-xs font-medium text-foreground">
              Deal name
            </label>
            <Input
              id="deal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme renewal"
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="deal-company" className="text-xs font-medium text-foreground">
                Company
              </label>
              <Input
                id="deal-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Inc."
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="deal-value" className="text-xs font-medium text-foreground">
                Value (USD)
              </label>
              <Input
                id="deal-value"
                value={value}
                onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="12500"
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-foreground">
                Stage
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Stage"
                    className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {stages.find((s) => s.id === stageId)?.name ?? "Select stage"}
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {stages.map((s) => (
                    <DropdownMenuItem key={s.id} onClick={() => setStageId(s.id)}>
                      <span className="w-4">
                        {s.id === stageId && <Check className="h-3.5 w-3.5" />}
                      </span>
                      {s.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-foreground">
                Expected close
              </span>
              <DatePicker
                value={closeDate}
                onChange={(date) => setCloseDate(date ?? null)}
                placeholder="Pick a date"
                className="w-full"
              />
            </div>
          </div>

          {members.length > 1 && (
            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-foreground">Owner</span>
              <MemberPicker members={members} value={ownerId} onChange={setOwnerId} />
            </div>
          )}

          {limitError && <UpgradePrompt message={limitError} targetPlan="PRO" />}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || saving}>
              {saving ? "Creating…" : "Create deal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
