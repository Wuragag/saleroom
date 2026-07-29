"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  Columns3,
  Handshake,
  List,
  Plus,
  Search,
  User,
} from "lucide-react";

import { apiClient, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDealValue } from "@/lib/deals";
import { DealBoard, type DealMovePatch } from "@/components/deals/deal-board";
import { DealList } from "@/components/deals/deal-list";
import { CreateDealDialog } from "@/components/deals/create-deal-dialog";
import { memberDisplayName } from "@/components/deals/member-picker";
import type { DealListItem, DealOwnerData, DealStageValue } from "@/types";

type ViewMode = "board" | "list";
type StatusFilter = "all" | "open" | "won" | "lost";

const STATUS_PILLS: { value: StatusFilter; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "all", label: "All" },
];

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

interface DealsWorkspaceProps {
  deals: DealListItem[];
  members: DealOwnerData[];
  currentUserId: string;
}

export function DealsWorkspace({
  deals: initialDeals,
  members,
  currentUserId,
}: DealsWorkspaceProps) {
  const router = useRouter();
  const [deals, setDeals] = useState<DealListItem[]>(initialDeals);
  // Sync server-rendered data into state after router.refresh()
  useEffect(() => setDeals(initialDeals), [initialDeals]);

  const [view, setView] = useState<ViewMode>("board");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [ownerFilter, setOwnerFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("deals-view") as ViewMode | null;
    if (saved === "board" || saved === "list") setView(saved);
  }, []);
  const changeView = (mode: ViewMode) => {
    setView(mode);
    localStorage.setItem("deals-view", mode);
  };

  // Search + owner apply everywhere; the status pills only drive the list
  // (the board shows status as columns).
  const baseFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return deals.filter((d) => {
      if (ownerFilter && d.owner.id !== ownerFilter) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) || d.company.toLowerCase().includes(q)
      );
    });
  }, [deals, ownerFilter, search]);

  const listFiltered = useMemo(() => {
    if (statusFilter === "all") return baseFiltered;
    return baseFiltered.filter((d) => d.status === statusFilter.toUpperCase());
  }, [baseFiltered, statusFilter]);

  const openDeals = deals.filter((d) => d.status === "OPEN");
  const openValue = openDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);

  const patchDeal = async (dealId: string, patch: DealMovePatch) => {
    const snapshot = deals;
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId
          ? {
              ...d,
              ...patch,
              closedAt:
                patch.status === undefined
                  ? d.closedAt
                  : patch.status === "OPEN"
                    ? null
                    : new Date().toISOString(),
            }
          : d
      )
    );
    try {
      await apiClient.patch(`/api/deals/${dealId}`, patch);
      if (patch.status === "WON") toast.success("Deal marked won 🎉");
      router.refresh();
    } catch (err) {
      setDeals(snapshot);
      toast.error(err instanceof ApiError ? err.message : "Failed to update deal");
    }
  };

  const ownerName = ownerFilter
    ? members.find((m) => m.id === ownerFilter)
    : null;

  return (
    <div>
      <PageHeader
        title="Deals"
        description="Every deal, its rooms, and how warm the buyer is — in one place."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            New deal
          </Button>
        }
      />

      <p className="mt-3 text-sm text-muted-foreground">
        Open pipeline{" "}
        <span className="font-semibold tabular-nums text-foreground">
          {formatDealValue(openValue)}
        </span>{" "}
        across {openDeals.length} open deal{openDeals.length === 1 ? "" : "s"}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {view === "list" && (
          <div className="flex items-center gap-1.5">
            {STATUS_PILLS.map((p) => (
              <Pill
                key={p.value}
                active={statusFilter === p.value}
                onClick={() => setStatusFilter(p.value)}
              >
                {p.label}
              </Pill>
            ))}
          </div>
        )}

        {members.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground">
                <User className="h-3 w-3" />
                {ownerName ? memberDisplayName(ownerName) : "All owners"}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setOwnerFilter(null)}>
                <span className="w-4">
                  {!ownerFilter && <Check className="h-3.5 w-3.5" />}
                </span>
                All owners
              </DropdownMenuItem>
              {members.map((m) => (
                <DropdownMenuItem key={m.id} onClick={() => setOwnerFilter(m.id)}>
                  <span className="w-4">
                    {ownerFilter === m.id && <Check className="h-3.5 w-3.5" />}
                  </span>
                  {memberDisplayName(m)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deals…"
            className="h-8 w-44 rounded-full border border-border bg-card pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex items-center rounded-full border border-border bg-card p-0.5">
          <button
            onClick={() => changeView("board")}
            aria-label="Board view"
            className={`rounded-full p-1.5 transition-colors ${
              view === "board"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Columns3 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => changeView("list")}
            aria-label="List view"
            className={`rounded-full p-1.5 transition-colors ${
              view === "list"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-5">
        {deals.length === 0 ? (
          <EmptyState
            icon={Handshake}
            title="No deals yet"
            description="Create your first deal to track it through your pipeline — then link the rooms you build for it."
            action={
              <Button onClick={() => setCreateOpen(true)}>
                <Plus />
                New deal
              </Button>
            }
          />
        ) : view === "board" ? (
          <DealBoard deals={baseFiltered} onMove={patchDeal} />
        ) : listFiltered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No deals match"
            description="Try a different search, owner, or status filter."
          />
        ) : (
          <DealList
            deals={listFiltered}
            onStageChange={(dealId, stage: DealStageValue) =>
              patchDeal(dealId, { stage })
            }
          />
        )}
      </div>

      {createOpen && (
        <CreateDealDialog
          isOpen
          onClose={() => setCreateOpen(false)}
          members={members}
          currentUserId={currentUserId}
          onCreated={() => router.refresh()}
        />
      )}
    </div>
  );
}
