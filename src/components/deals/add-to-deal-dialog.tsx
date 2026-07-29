"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Handshake, Plus } from "lucide-react";

import { apiClient, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDealValue, STAGE_LABELS } from "@/lib/deals";
import { CreateDealDialog } from "@/components/deals/create-deal-dialog";
import type { DealListItem } from "@/types";

interface AddToDealDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
  pageTitle: string;
}

/**
 * Dashboard touchpoint: attach a room to an existing open deal, or create a
 * new deal from it.
 */
export function AddToDealDialog({
  isOpen,
  onClose,
  pageId,
  pageTitle,
}: AddToDealDialogProps) {
  const router = useRouter();
  const [deals, setDeals] = useState<DealListItem[] | null>(null);
  const [mode, setMode] = useState<"pick" | "create">("pick");
  const [linkingId, setLinkingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<DealListItem[]>("/api/deals")
      .then((all) => {
        if (cancelled) return;
        const open = all.filter((d) => d.status === "OPEN");
        setDeals(open);
        if (open.length === 0) setMode("create");
      })
      .catch(() => {
        if (!cancelled) {
          setDeals([]);
          setMode("create");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const attach = async (deal: DealListItem) => {
    setLinkingId(deal.id);
    try {
      await apiClient.post(`/api/deals/${deal.id}/rooms`, { pageId });
      toast.success(`Added to "${deal.name}"`, {
        action: {
          label: "Open deal",
          onClick: () => router.push(`/deals/${deal.id}`),
        },
      });
      router.refresh();
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add to deal");
      setLinkingId(null);
    }
  };

  if (mode === "create") {
    return (
      <CreateDealDialog
        isOpen={isOpen}
        onClose={onClose}
        members={[]}
        currentUserId=""
        prefill={{ pageId, name: pageTitle }}
        onCreated={() => router.refresh()}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to deal</DialogTitle>
          <DialogDescription>
            Link &ldquo;{pageTitle}&rdquo; to a deal so its buyer engagement rolls
            up to your pipeline.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-72 overflow-y-auto rounded-lg border border-border">
          {deals === null ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Loading deals…
            </p>
          ) : (
            <div className="divide-y divide-border">
              {deals.map((deal) => (
                <div key={deal.id} className="flex items-center gap-3 px-3 py-2.5">
                  <Handshake className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {deal.name}
                    </p>
                    <p className="truncate text-2xs text-muted-foreground">
                      {[
                        deal.company,
                        STAGE_LABELS[deal.stage],
                        deal.value !== null ? formatDealValue(deal.value) : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => attach(deal)}
                    disabled={linkingId !== null}
                  >
                    {linkingId === deal.id ? "Adding…" : "Add"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button variant="ghost" onClick={() => setMode("create")} className="justify-center">
          <Plus />
          New deal for this room
        </Button>
      </DialogContent>
    </Dialog>
  );
}
