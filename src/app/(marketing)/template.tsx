/**
 * Route transition for the marketing site. A template re-mounts on every
 * navigation (unlike a layout), so the entrance animation replays when the
 * visitor moves between /, /pricing, /features/… — a soft fade-and-rise
 * instead of a hard cut. Disabled under prefers-reduced-motion (see
 * marketing.css).
 */
export default function MarketingTemplate({ children }: { children: React.ReactNode }) {
  return <div className="mk-page">{children}</div>
}
