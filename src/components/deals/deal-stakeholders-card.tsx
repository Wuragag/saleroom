"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { apiClient, ApiError } from "@/lib/api-client";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";
import { formatRelativeTime } from "@/lib/format-utils";
import type {
  DealDetailData,
  DealStakeholderRow,
  DealStakeholderSuggestion,
  IntentLabel,
} from "@/types";

const INTENT_VARIANT: Record<IntentLabel, "success" | "warning" | "neutral"> = {
  "High Intent": "success",
  Warm: "warning",
  Cold: "neutral",
};

function StakeholderRow({
  stakeholder,
  onDelete,
}: {
  stakeholder: DealStakeholderRow;
  onDelete: () => void;
}) {
  const display = stakeholder.name || stakeholder.email;
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Avatar name={display} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{display}</p>
        <p className="truncate text-2xs text-muted-foreground">
          {[stakeholder.title, stakeholder.name ? stakeholder.email : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {stakeholder.intent ? (
          <span className="flex items-center gap-1.5">
            <Badge variant={INTENT_VARIANT[stakeholder.intent]}>
              {stakeholder.intent}
            </Badge>
            {stakeholder.lastSeenAt && (
              <span className="text-2xs text-muted-foreground whitespace-nowrap">
                {formatRelativeTime(stakeholder.lastSeenAt)}
              </span>
            )}
          </span>
        ) : (
          <span className="text-2xs text-muted-foreground">Not visited</span>
        )}
        <IconButton
          aria-label={`Remove ${display} from this deal`}
          size="sm"
          onClick={onDelete}
        >
          <Trash2 />
        </IconButton>
      </div>
    </div>
  );
}

interface DealStakeholdersCardProps {
  deal: DealDetailData;
  onChanged: () => void;
}

export function DealStakeholdersCard({ deal, onChanged }: DealStakeholdersCardProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const addStakeholder = async (payload: {
    name?: string;
    email: string;
    title?: string;
  }) => {
    try {
      await apiClient.post(`/api/deals/${deal.id}/stakeholders`, payload);
      toast.success("Stakeholder added");
      onChanged();
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error("Already on this deal");
      } else {
        toast.error(
          err instanceof ApiError ? err.message : "Failed to add stakeholder"
        );
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || saving) return;
    setSaving(true);
    const ok = await addStakeholder({
      name: name.trim(),
      email: email.trim(),
      title: title.trim(),
    });
    if (ok) {
      setName("");
      setEmail("");
      setTitle("");
    }
    setSaving(false);
  };

  const remove = async (s: DealStakeholderRow) => {
    try {
      await apiClient.delete(`/api/deals/${deal.id}/stakeholders/${s.id}`);
      onChanged();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to remove stakeholder"
      );
    }
  };

  const suggestionLabel = (s: DealStakeholderSuggestion) => s.name || s.email;

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <SectionLabel>
          Stakeholders
          {deal.stakeholders.length > 0 ? ` · ${deal.stakeholders.length}` : ""}
        </SectionLabel>
      </div>

      {deal.stakeholders.length === 0 ? (
        <p className="px-4 py-5 text-sm text-muted-foreground">
          Add the people involved on the buyer side. Anyone who has opened a
          linked room shows up with their engagement.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {deal.stakeholders.map((s) => (
            <StakeholderRow key={s.id} stakeholder={s} onDelete={() => remove(s)} />
          ))}
        </div>
      )}

      {deal.stakeholderSuggestions.length > 0 && (
        <div className="border-t border-border px-4 py-3">
          <p className="text-2xs font-medium text-muted-foreground">
            From your rooms
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {deal.stakeholderSuggestions.map((s) => (
              <button
                key={s.email}
                onClick={() =>
                  addStakeholder({ name: s.name ?? "", email: s.email })
                }
                title={s.email}
                className="flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-2xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                <Plus className="h-3 w-3" />
                {suggestionLabel(s)}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-2 border-t border-border px-4 py-3"
      >
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            aria-label="Stakeholder name"
          />
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Role or title"
            aria-label="Stakeholder role or title"
          />
        </div>
        <div className="flex gap-2">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@company.com"
            type="email"
            required
            aria-label="Stakeholder email"
          />
          <Button type="submit" size="sm" disabled={!email.trim() || saving} className="shrink-0">
            <Plus />
            Add
          </Button>
        </div>
      </form>
    </div>
  );
}
