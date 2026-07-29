"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BarChart2, Eye, Flame, Link2, Lock, Pencil, Plus, Unlink } from "lucide-react";

import { apiClient, ApiError } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { SectionLabel } from "@/components/ui/section-label";
import { Monogram } from "@/components/ui/monogram";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { formatRelativeTime } from "@/lib/format-utils";
import { LinkRoomDialog } from "@/components/deals/link-room-dialog";
import type { DealDetailData, DealRoomDetail } from "@/types";

function RoomRow({
  room,
  onUnlink,
}: {
  room: DealRoomDetail;
  onUnlink: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Monogram name={room.title} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {room.restricted ? (
            <span className="truncate text-sm font-medium text-foreground">
              {room.title}
            </span>
          ) : (
            <Link
              href={`/editor/${room.id}`}
              className="truncate text-sm font-medium text-foreground hover:underline"
            >
              {room.title}
            </Link>
          )}
          {room.restricted && (
            <Badge variant="neutral" className="gap-1">
              <Lock className="h-2.5 w-2.5" />
              Private
            </Badge>
          )}
          <Badge variant={room.published ? "success" : "neutral"}>
            {room.published ? "Live" : "Draft"}
          </Badge>
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-2xs text-muted-foreground">
          <span className="flex items-center gap-1 tabular-nums">
            <Eye className="h-3 w-3" />
            {room.views}
          </span>
          {room.highIntentCount > 0 && (
            <span className="flex items-center gap-1 tabular-nums">
              <Flame className="h-3 w-3" />
              {room.highIntentCount} hot
            </span>
          )}
          <span>
            {room.lastActivityAt
              ? `Active ${formatRelativeTime(room.lastActivityAt)}`
              : "No buyer activity yet"}
          </span>
        </div>
      </div>
      {/* A restricted room (another member's PRIVATE page) shows only the
          summary — its analytics/editor would 403, and unlinking requires
          page edit. */}
      {!room.restricted && (
        <div className="flex shrink-0 items-center gap-0.5">
          <Link href={`/analytics/${room.id}`}>
            <IconButton aria-label={`Analytics for ${room.title}`} size="sm">
              <BarChart2 />
            </IconButton>
          </Link>
          <Link href={`/editor/${room.id}`}>
            <IconButton aria-label={`Edit ${room.title}`} size="sm">
              <Pencil />
            </IconButton>
          </Link>
          <IconButton
            aria-label={`Unlink ${room.title} from this deal`}
            size="sm"
            onClick={onUnlink}
          >
            <Unlink />
          </IconButton>
        </div>
      )}
    </div>
  );
}

interface DealRoomsCardProps {
  deal: DealDetailData;
  onChanged: () => void;
}

export function DealRoomsCard({ deal, onChanged }: DealRoomsCardProps) {
  const router = useRouter();
  const [linkOpen, setLinkOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);

  const unlink = async (room: DealRoomDetail) => {
    try {
      await apiClient.delete(`/api/deals/${deal.id}/rooms/${room.id}`);
      toast.success(`Unlinked "${room.title}"`);
      onChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to unlink room");
    }
  };

  // "Build the room for this deal": create a page, link it, jump to the editor.
  const createRoom = async () => {
    if (creating) return;
    setCreating(true);
    setLimitError(null);
    try {
      const page = await apiClient.post<{ id: string }>("/api/pages", {
        title: deal.name,
      });
      await apiClient.post(`/api/deals/${deal.id}/rooms`, { pageId: page.id });
      router.push(`/editor/${page.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.code === "PLAN_LIMIT") {
        setLimitError(err.message);
      } else {
        toast.error(err instanceof ApiError ? err.message : "Failed to create room");
      }
      setCreating(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <SectionLabel>
          Rooms{deal.rooms.length > 0 ? ` · ${deal.rooms.length}` : ""}
        </SectionLabel>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setLinkOpen(true)}>
            <Link2 />
            Link room
          </Button>
          <Button size="sm" onClick={createRoom} disabled={creating}>
            <Plus />
            {creating ? "Creating…" : "New room"}
          </Button>
        </div>
      </div>

      {limitError && (
        <div className="px-4 pt-3">
          <UpgradePrompt message={limitError} targetPlan="PRO" />
        </div>
      )}

      {deal.rooms.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">
          No rooms yet. Link an existing room or create one for this deal — buyer
          engagement from every linked room rolls up here.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {deal.rooms.map((room) => (
            <RoomRow key={room.id} room={room} onUnlink={() => unlink(room)} />
          ))}
        </div>
      )}

      {linkOpen && (
        <LinkRoomDialog
          isOpen
          onClose={() => setLinkOpen(false)}
          dealId={deal.id}
          onLinked={() => {
            setLinkOpen(false);
            onChanged();
          }}
        />
      )}
    </div>
  );
}
