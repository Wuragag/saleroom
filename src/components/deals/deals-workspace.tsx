"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarDays,
  Check,
  Columns3,
  Flame,
  Handshake,
  List,
  Milestone,
  Plus,
  Search,
  User,
  X,
  type LucideIcon,
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
import {
  CLOSE_DATE_FILTERS,
  DEAL_STAGES,
  WARMTH_FILTERS,
  filterDeals,
  formatDealValue,
  type CloseDateFilter,
  type WarmthFilter,
} from "@/lib/deals";
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

/** One toolbar filter: a pill trigger + "All …" plus the given options. */
function FilterDropdown<T extends string>({
  icon: Icon,
  allLabel,
  value,
  options,
  onChange,
}: {
  icon: LucideIcon;
  allLabel: string;
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (value: T | null) => void;
}) {
  const active = options.find((o) => o.value === value);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
            active
              ? "border-primary/50 bg-card text-foreground"
              : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
          }`}
        >
          <Icon className="h-3 w-3" />
          {active ? active.label : allLabel}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => onChange(null)}>
          <span className="w-4">
            {!active && <Check className="h-3.5 w-3.5" />}
          </span>
          {allLabel}
        </DropdownMenuItem>
        {options.map((option) => (
          <DropdownMenuItem key={option.value} onClick={() => onChange(option.value)}>
            <span className="w-4">
              {option.value === value && <Check className="h-3.5 w-3.5" />}
            </span>
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
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
  const [warmthFilter, setWarmthFilter] = useState<WarmthFilter | null>(null);
  const [closeDateFilter, setCloseDateFilter] = useState<CloseDateFilter | null>(null);
  const [stageFilter, setStageFilter] = useState<DealStageValue | null>(null);
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

  // Search, owner, warmth, and close date apply everywhere; the status pills
  // and stage filter only drive the list (the board shows both as columns).
  const baseFiltered = useMemo(
    () =>
      filterDeals(deals, {
        query: search,
        ownerId: ownerFilter,
        warmth: warmthFilter,
        closeDate: closeDateFilter,
      }),
    [deals, search, ownerFilter, warmthFilter, closeDateFilter]
  );

  const listFiltered = useMemo(
    () =>
      filterDeals(baseFiltered, {
        status:
          statusFilter === "all"
            ? null
            : (statusFilter.toUpperCase() as DealListItem["status"]),
        stage: stageFilter,
      }),
    [baseFiltered, statusFilter, stageFilter]
  );

  const hasActiveFilters =
    !!search.trim() ||
    !!ownerFilter ||
    !!warmthFilter ||
    !!closeDateFilter ||
    !!stageFilter;

  const clearFilters = () => {
    setSearch("");
    setOwnerFilter(null);
    setWarmthFilter(null);
    setCloseDateFilter(null);
    setStageFilter(null);
  };

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

        {view === "list" && (
          <FilterDropdown
            icon={Milestone}
            allLabel="All stages"
            value={stageFilter}
            options={DEAL_STAGES.map((s) => ({ value: s.value, label: s.label }))}
            onChange={setStageFilter}
          />
        )}

        {members.length > 1 && (
          <FilterDropdown
            icon={User}
            allLabel="All owners"
            value={ownerFilter}
            options={members.map((m) => ({
              value: m.id,
              label: memberDisplayName(m),
            }))}
            onChange={setOwnerFilter}
          />
        )}

        <FilterDropdown
          icon={Flame}
          allLabel="Warmth"
          value={warmthFilter}
          options={WARMTH_FILTERS}
          onChange={setWarmthFilter}
        />

        <FilterDropdown
          icon={CalendarDays}
          allLabel="Close date"
          value={closeDateFilter}
          options={CLOSE_DATE_FILTERS}
          onChange={setCloseDateFilter}
        />

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
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
            description="Try different filters, or clear them to see every deal."
            action={
              hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  <X />
                  Clear filters
                </Button>
              ) : undefined
            }
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
