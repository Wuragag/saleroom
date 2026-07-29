"use client";

import { useState } from "react";
import { toast } from "sonner";

import { apiClient, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { MemberPicker } from "@/components/deals/member-picker";
import { DEAL_STAGES } from "@/lib/deals";
import type { DealOwnerData, DealStageValue } from "@/types";

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
  currentUserId: string;
  prefill?: CreateDealPrefill;
  /** Called with the new deal id after a successful create. */
  onCreated: (dealId: string) => void;
}

export function CreateDealDialog({
  isOpen,
  onClose,
  members,
  currentUserId,
  prefill,
  onCreated,
}: CreateDealDialogProps) {
  const [name, setName] = useState(prefill?.name ?? "");
  const [company, setCompany] = useState("");
  const [value, setValue] = useState("");
  const [stage, setStage] = useState<DealStageValue>("NEW");
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
      // Accept pasted "$12,500" the same way the detail page does.
      const parsedValue =
        value.trim() === "" ? null : Number(value.replace(/[$,\s]/g, ""));
      if (parsedValue !== null && (!Number.isFinite(parsedValue) || parsedValue < 0)) {
        toast.error("Enter the deal value as a plain number");
        return;
      }
      const deal = await apiClient.post<{ id: string }>("/api/deals", {
        name: name.trim(),
        company: company.trim(),
        value: parsedValue,
        stage,
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
                onChange={(e) => setValue(e.target.value)}
                placeholder="12500"
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="deal-stage" className="text-xs font-medium text-foreground">
                Stage
              </label>
              <select
                id="deal-stage"
                value={stage}
                onChange={(e) => setStage(e.target.value as DealStageValue)}
                className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {DEAL_STAGES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
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
