// Next.js App Router automatically wraps this in a Suspense boundary
// and shows it while page.tsx is server-rendering / fetching data.

// Title widths cycle across cards so they look varied, not cloned.
const TITLE_WIDTHS = ["75%", "60%", "80%", "55%", "70%", "65%"];

function SkeletonCard({ index }: { index: number }) {
  const titleW = TITLE_WIDTHS[index % TITLE_WIDTHS.length];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
      {/* Thumbnail — aspect-video matches the real PageThumbnail */}
      <div className="w-full aspect-video bg-muted" />

      {/* Body */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="h-[15px] rounded-md bg-muted" style={{ width: titleW }} />
          <div className="h-7 w-7 rounded-lg bg-muted shrink-0 opacity-60" />
        </div>

        {/* Spacer so footer stays at bottom */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-border">
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded-full bg-muted shrink-0" />
            <div className="h-3 w-14 rounded bg-muted" />
          </div>
          <div className="h-5 w-16 rounded-full bg-muted" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 px-4 pb-4">
        <div className="h-8 flex-1 rounded-lg bg-muted" />
        <div className="h-8 flex-1 rounded-lg bg-muted opacity-60" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <main className="min-h-screen bg-background">
      {/* ── Nav — static, not animated ─────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full bg-primary">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-6">
          {/* Brand */}
          <div className="h-4 w-24 rounded bg-primary-foreground/25" />
          {/* Nav links */}
          <div className="flex items-center gap-0.5">
            {[62, 80, 96, 68].map((w, i) => (
              <div
                key={i}
                className="h-7 rounded-lg bg-primary-foreground/10"
                style={{ width: w }}
              />
            ))}
          </div>
          <div className="flex-1" />
          {/* User area */}
          <div className="h-7 w-7 rounded-full bg-primary-foreground/20" />
          <div className="h-3 w-32 rounded bg-primary-foreground/15 hidden sm:block" />
          <div className="h-7 w-20 rounded-lg bg-primary-foreground/10 hidden sm:block" />
        </div>
      </header>

      {/* ── Content — pulsing ──────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-6 animate-pulse">

        {/* Dashboard header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-28 rounded-md bg-muted" />
            <div className="h-4 w-52 rounded bg-muted opacity-70" />
          </div>
          <div className="h-8 w-24 rounded-lg bg-muted shrink-0" />
        </div>

        <div className="mt-6">
          {/* Toolbar row */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {/* Status pills */}
            <div className="h-7 w-36 rounded-full bg-muted" />
            <div className="flex-1" />
            {/* Search */}
            <div className="h-8 w-36 rounded-lg bg-muted" />
            {/* Sort */}
            <div className="h-8 w-28 rounded-lg bg-muted" />
            {/* View toggle */}
            <div className="h-8 w-16 rounded-lg bg-muted" />
          </div>

          {/* Card grid — 6 cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} index={i} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
