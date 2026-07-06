// Next.js App Router automatically wraps this in a Suspense boundary
// and shows it while page.tsx is server-rendering / fetching data.
// Mirrors the editorial AppShell (floating rail + floating surface) so there's
// no flash of a different layout on navigation.

// Title widths cycle across cards so they look varied, not cloned.
const TITLE_WIDTHS = ["70%", "55%", "80%"];

function SkeletonStat() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-elevation-1">
      <div className="flex items-center justify-between">
        <div className="h-3 w-20 rounded bg-muted" />
        <div className="h-6 w-6 rounded-md bg-muted" />
      </div>
      <div className="mt-3 h-9 w-16 rounded-md bg-muted" />
      <div className="mt-2 h-3 w-24 rounded bg-muted opacity-70" />
    </div>
  );
}

function SkeletonRow({ index }: { index: number }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
      <div className="h-8 w-8 rounded-lg bg-muted shrink-0" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div
          className="h-3.5 rounded bg-muted"
          style={{ width: TITLE_WIDTHS[index % TITLE_WIDTHS.length] }}
        />
        <div className="h-2.5 w-40 rounded bg-muted opacity-60" />
      </div>
      <div className="h-5 w-16 rounded-full bg-muted hidden sm:block" />
      <div className="h-6 w-6 rounded-full bg-muted shrink-0" />
    </div>
  );
}

export default function Loading() {
  return (
    <div className="flex min-h-screen gap-4 bg-background p-4">
      {/* ── Icon rail — static, not animated ───────────────────────────── */}
      <aside className="flex w-10 shrink-0 flex-col">
        <div className="h-7 w-7 rounded-lg bg-muted" />
        <div className="mt-4 flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[18px] w-[18px] rounded bg-muted mx-[3px]" />
          ))}
        </div>
        <div className="mt-auto flex flex-col gap-3">
          <div className="h-[18px] w-[18px] rounded bg-muted mx-[3px]" />
          <div className="h-7 w-7 rounded-full bg-muted" />
        </div>
      </aside>

      {/* ── Floating main surface ──────────────────────────────────────── */}
      <main className="min-h-[calc(100vh-2rem)] min-w-0 flex-1 rounded-xl border border-border bg-card p-8 shadow-elevation-1">
        <div className="animate-pulse">
          {/* Masthead */}
          <div className="rounded-xl border border-border bg-card p-8 shadow-elevation-1">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="mt-3 h-9 w-52 rounded-md bg-muted" />
            <div className="mt-3 h-4 w-72 max-w-full rounded bg-muted opacity-70" />
            <div className="mt-6 flex items-center gap-2">
              <div className="h-9 w-32 rounded-full bg-muted" />
              <div className="h-9 w-36 rounded-full bg-muted opacity-70" />
              <div className="h-9 w-9 rounded-lg bg-muted opacity-70" />
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </div>

          {/* Toolbar */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <div className="h-8 w-36 rounded-full bg-muted" />
            <div className="flex-1" />
            <div className="h-8 w-36 rounded-lg bg-muted" />
            <div className="h-8 w-16 rounded-lg bg-muted" />
          </div>

          {/* List */}
          <div className="mt-5 rounded-xl border border-border bg-card overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonRow key={i} index={i} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
