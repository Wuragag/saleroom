import { Layers } from "lucide-react";
import type { SectionEngagement } from "@/lib/section-engagement";
import { formatDuration } from "@/lib/format-utils";

interface SectionEngagementPanelProps {
  sections: SectionEngagement[];
}

/**
 * Page-level section engagement: how buyer attention distributes across the
 * deck's tabs, in deck order. Unopened tabs render an explicit "Not viewed"
 * state — for a seller, a skipped Next Steps tab is as loud a signal as a
 * heavily-read Pricing tab.
 */
export function SectionEngagementPanel({ sections }: SectionEngagementPanelProps) {
  const hasActivity = sections.some((s) => s.durationSeconds > 0);

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <Layers className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Section engagement</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-5">
        Time buyers spent in each part of this page
      </p>

      {sections.length === 0 || !hasActivity ? (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          No section activity yet — engagement appears once buyers open the page.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sections.map((s) => (
            <div key={s.tabId} className="flex items-center gap-3">
              <span
                className={`w-36 shrink-0 truncate text-xs font-medium ${
                  s.durationSeconds > 0 ? "text-foreground" : "text-muted-foreground"
                }`}
                title={s.tabName}
              >
                {s.tabName}
              </span>
              {s.durationSeconds > 0 ? (
                <>
                  <div className="flex-1 min-w-[80px] bg-muted rounded-full overflow-hidden h-2">
                    <div
                      className="h-full rounded-full bg-primary/80"
                      style={{ width: `${Math.max(2, s.sharePct)}%` }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right text-xs font-mono text-muted-foreground tabular-nums">
                    {formatDuration(s.durationSeconds)}
                  </span>
                  <span
                    className="w-10 shrink-0 text-right text-2xs text-muted-foreground tabular-nums"
                    title={`Opened ${s.viewCount} time${s.viewCount === 1 ? "" : "s"}`}
                  >
                    {s.viewCount}×
                  </span>
                </>
              ) : (
                <span className="flex-1 text-xs text-muted-foreground/70 italic">
                  Not viewed
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
