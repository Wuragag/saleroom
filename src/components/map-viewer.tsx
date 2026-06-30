"use client";

import { useState, useCallback, useEffect } from "react";
import { Check, Calendar, User } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { MutualActionPlanData, MapItemData } from "@/types";

interface MapViewerProps {
  slug: string;
  accentColor: string;
  isDark: boolean;
}

export function MapViewer({ slug, accentColor, isDark }: MapViewerProps) {
  const [map, setMap] = useState<MutualActionPlanData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMap = useCallback(async () => {
    try {
      const data = await apiClient.get<{ map?: MutualActionPlanData | null }>(`/api/map/${slug}`);
      setMap(data.map ?? null);
    } catch {
      // silent — map is optional
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchMap();
  }, [fetchMap]);

  // Show a lightweight skeleton while the map loads so the section does not
  // pop in abruptly. Once loaded, the map is optional — render nothing if empty.
  if (loading) return <MapViewerSkeleton isDark={isDark} />;
  if (!map || map.items.length === 0) return null;

  const completedCount = map.items.filter((i) => i.completed).length;
  const totalCount = map.items.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const toggleItem = async (itemId: string, completed: boolean) => {
    // Optimistic update
    setMap((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId ? { ...item, completed } : item
        ),
      };
    });

    try {
      await apiClient.post(`/api/map/${slug}/toggle`, { itemId, completed });
    } catch {
      fetchMap(); // Revert on error
    }
  };

  return (
    <div
      className="mt-12 pt-10"
      style={{ borderTop: "1px solid var(--pub-divider)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2
            className="text-xl font-bold tracking-tight"
            style={{
              color: "var(--pub-heading-color)",
              fontFamily: "var(--pub-font-body, inherit)",
            }}
          >
            {map.title}
          </h2>
          {map.closeDate && (
            <p
              className="text-sm mt-1 flex items-center gap-1.5"
              style={{ color: "var(--pub-body-color)" }}
            >
              <Calendar className="h-3.5 w-3.5" />
              Target close:{" "}
              {new Date(map.closeDate).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </div>
        <div
          className="text-right flex-shrink-0"
          style={{ color: "var(--pub-body-color)" }}
        >
          <span
            className="text-2xl font-bold tabular-nums"
            style={{ color: accentColor }}
          >
            {progress}%
          </span>
          <p className="text-xs mt-0.5">
            {completedCount} of {totalCount}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="h-2 rounded-full overflow-hidden mb-8"
        style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, background: accentColor }}
        />
      </div>

      {/* Items */}
      <div className="space-y-0">
        {map.items.map((item, i) => (
          <MapViewerItem
            key={item.id}
            item={item}
            accentColor={accentColor}
            isDark={isDark}
            isLast={i === map.items.length - 1}
            onToggle={(completed) => toggleItem(item.id, completed)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Loading skeleton — mirrors the map layout while data is fetched ──

function MapViewerSkeleton({ isDark }: { isDark: boolean }) {
  const block = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  return (
    <div
      className="mt-12 pt-10"
      style={{ borderTop: "1px solid var(--pub-divider)" }}
      aria-hidden="true"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="space-y-2">
          <div
            className="h-6 w-48 rounded-md animate-pulse"
            style={{ background: block }}
          />
          <div
            className="h-4 w-32 rounded-md animate-pulse"
            style={{ background: block }}
          />
        </div>
        <div className="flex flex-col items-end gap-2">
          <div
            className="h-7 w-14 rounded-md animate-pulse"
            style={{ background: block }}
          />
          <div
            className="h-3 w-16 rounded-md animate-pulse"
            style={{ background: block }}
          />
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="h-2 rounded-full overflow-hidden mb-8 animate-pulse"
        style={{ background: block }}
      />

      {/* Items */}
      <div className="space-y-0">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-start gap-4 py-4"
            style={{
              borderBottom: i === 2 ? "none" : "1px solid var(--pub-divider)",
            }}
          >
            <div
              className="flex-shrink-0 mt-0.5 h-5 w-5 rounded-md animate-pulse"
              style={{ background: block }}
            />
            <div className="flex-1 min-w-0 space-y-2">
              <div
                className="h-4 w-3/4 rounded-md animate-pulse"
                style={{ background: block }}
              />
              <div
                className="h-4 w-24 rounded-full animate-pulse"
                style={{ background: block }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Single item in the buyer view ──

function MapViewerItem({
  item,
  accentColor,
  isDark,
  isLast,
  onToggle,
}: {
  item: MapItemData;
  accentColor: string;
  isDark: boolean;
  isLast: boolean;
  onToggle: (completed: boolean) => void;
}) {
  const isOverdue =
    item.dueDate && !item.completed && new Date(item.dueDate) < new Date();

  return (
    <div
      className="flex items-start gap-4 py-4"
      style={{
        borderBottom: isLast ? "none" : "1px solid var(--pub-divider)",
      }}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(!item.completed)}
        className="relative flex-shrink-0 mt-0.5 h-5 w-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center"
        style={{
          borderColor: item.completed ? accentColor : isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
          background: item.completed ? accentColor : "transparent",
        }}
        aria-label={item.completed ? "Mark incomplete" : "Mark complete"}
      >
        {item.completed && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium transition-all duration-200"
          style={{
            color: item.completed
              ? "var(--pub-body-color)"
              : "var(--pub-heading-color)",
            textDecoration: item.completed ? "line-through" : "none",
            opacity: item.completed ? 0.6 : 1,
          }}
        >
          {item.title}
        </p>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {/* Owner badge */}
          <span
            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              background:
                item.ownerType === "buyer"
                  ? `${accentColor}18`
                  : isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(0,0,0,0.05)",
              color:
                item.ownerType === "buyer"
                  ? accentColor
                  : "var(--pub-body-color)",
            }}
          >
            {item.ownerType === "buyer" ? "Buyer" : "Seller"}
          </span>

          {item.ownerName && (
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: "var(--pub-body-color)" }}
            >
              <User className="h-3 w-3" />
              {item.ownerName}
            </span>
          )}

          {item.dueDate && (
            <span
              className="flex items-center gap-1 text-xs"
              style={{
                color: isOverdue ? "#ef4444" : "var(--pub-body-color)",
              }}
            >
              <Calendar className="h-3 w-3" />
              {new Date(item.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
              {isOverdue && " (overdue)"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
