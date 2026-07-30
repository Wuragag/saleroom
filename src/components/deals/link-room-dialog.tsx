"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";

import { apiClient, ApiError } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Monogram } from "@/components/ui/monogram";

interface LinkablePage {
  id: string;
  title: string;
  published: boolean;
  dealId: string | null;
}

interface LinkRoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dealId: string;
  onLinked: () => void;
}

export function LinkRoomDialog({
  isOpen,
  onClose,
  dealId,
  onLinked,
}: LinkRoomDialogProps) {
  const [pages, setPages] = useState<LinkablePage[] | null>(null);
  const [search, setSearch] = useState("");
  const [linkingId, setLinkingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<LinkablePage[]>("/api/pages")
      .then((all) => {
        if (!cancelled) setPages(all.filter((p) => !p.dealId));
      })
      .catch(() => {
        if (!cancelled) setPages([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!pages) return [];
    const q = search.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter((p) => p.title.toLowerCase().includes(q));
  }, [pages, search]);

  const link = async (page: LinkablePage) => {
    setLinkingId(page.id);
    try {
      await apiClient.post(`/api/deals/${dealId}/rooms`, { pageId: page.id });
      toast.success(`Linked "${page.title}"`);
      onLinked();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to link room");
      setLinkingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link a room</DialogTitle>
          <DialogDescription>
            Attach an existing room — its buyer engagement rolls up to this deal.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rooms…"
            className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="max-h-72 overflow-y-auto rounded-lg border border-border">
          {pages === null ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Loading rooms…
            </p>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {pages.length === 0
                ? "Every room is already linked to a deal."
                : "No rooms match your search."}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((page) => (
                <div key={page.id} className="flex items-center gap-3 px-3 py-2.5">
                  <Monogram name={page.title} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {page.title}
                    </p>
                  </div>
                  <Badge variant={page.published ? "success" : "neutral"}>
                    {page.published ? "Live" : "Draft"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => link(page)}
                    disabled={linkingId !== null}
                  >
                    {linkingId === page.id ? "Linking…" : "Link"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
