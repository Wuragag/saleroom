"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutGrid,
  BarChart2,
  FileText,
  Blocks,
  Settings,
  PanelLeft,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAppTheme } from "@/hooks/use-app-theme";
import { Avatar } from "@/components/ui/avatar";
import { IconButton } from "@/components/ui/icon-button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  tourId?: string;
}[] = [
  { href: "/dashboard", label: "Pages", icon: LayoutGrid },
  { href: "/analytics", label: "Analytics", icon: BarChart2, tourId: "nav-analytics" },
  { href: "/submissions", label: "Submissions", icon: FileText },
  { href: "/library", label: "Library", icon: Blocks },
  { href: "/settings", label: "Settings", icon: Settings, tourId: "nav-settings" },
];

function isActivePath(pathname: string, href: string) {
  return href === "/dashboard"
    ? pathname === "/" || pathname.startsWith("/dashboard")
    : pathname.startsWith(href);
}

/** One rail row: icon pinned, label slides in when the rail is expanded. */
function RailLabel({
  expanded,
  className,
  children,
}: {
  expanded: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "truncate text-small font-medium transition-all duration-200",
        expanded ? "min-w-0 flex-1 opacity-100" : "pointer-events-none w-0 opacity-0",
        className
      )}
    >
      {children}
    </span>
  );
}

const railRowClass = (expanded: boolean, active = false) =>
  cn(
    "flex h-9 items-center rounded-lg transition-colors",
    expanded ? "gap-3 px-[7px]" : "justify-center",
    active
      ? "border border-border bg-card text-foreground shadow-elevation-1"
      : "border border-transparent text-muted-foreground hover:bg-card/70 hover:text-foreground"
  );

/**
 * The seller-app chrome. Desktop: a floating collapsible icon rail beside a
 * floating main surface. Mobile (<md): a slim top bar with a hamburger that
 * opens a labeled slide-in menu — tooltips don't fire on touch, so the rail
 * is desktop-only.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { theme, toggle } = useAppTheme();
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    setMobileOpen(false);
    await signOut({ redirect: false });
    router.push("/auth/signin");
  }

  const user = session?.user;
  const plan = user?.plan ?? "FREE";
  const ThemeIcon = theme === "dark" ? Sun : Moon;
  const themeLabel = theme === "dark" ? "Light" : "Dark";

  return (
    <div className="flex min-h-screen flex-col gap-3 bg-background p-3 md:flex-row md:gap-4 md:p-4">
      {/* ── Mobile top bar (<md) ── */}
      <header className="flex h-11 shrink-0 items-center justify-between md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2" aria-label="SalesRoom">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary font-display text-base text-primary-foreground">
            S
          </span>
          <span className="font-display text-heading text-foreground">SalesRoom</span>
        </Link>
        <IconButton
          aria-label="Open menu"
          variant="outline"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-4 w-4" />
        </IconButton>
      </header>

      {/* ── Mobile slide-in menu ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <nav className="absolute bottom-0 right-0 top-0 flex w-72 flex-col border-l border-border bg-card p-4 shadow-elevation-3 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between">
              <span className="font-display text-heading text-foreground">SalesRoom</span>
              <IconButton aria-label="Close menu" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </IconButton>
            </div>

            <div className="mt-4 flex flex-col gap-1">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-lg px-3 text-small font-medium transition-colors",
                    isActivePath(pathname, href)
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {label}
                </Link>
              ))}
            </div>

            <button
              onClick={toggle}
              className="mt-1 flex h-10 items-center gap-3 rounded-lg px-3 text-small font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <ThemeIcon className="h-[18px] w-[18px]" />
              {themeLabel} mode
            </button>

            <div className="mt-auto border-t border-border pt-4">
              {user && (
                <div className="mb-3 flex items-center gap-2.5">
                  <Avatar name={user.name || user.email || "?"} src={user.image} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-small font-medium text-foreground">
                      {user.name || "You"}
                    </p>
                    <p className="truncate text-3xs uppercase tracking-wide text-tertiary">
                      {plan} plan
                    </p>
                  </div>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-small font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                <LogOut className="h-[18px] w-[18px]" />
                Sign out
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* ── Floating icon rail (md+) ── */}
      <aside
        className={cn(
          "sticky top-4 z-30 hidden h-[calc(100vh-2rem)] shrink-0 flex-col overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:flex",
          expanded ? "w-[216px]" : "w-10"
        )}
      >
        {/* Brand */}
        <Link
          href="/dashboard"
          className="flex h-10 items-center gap-2.5 px-1.5"
          aria-label="SalesRoom"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary font-display text-base text-primary-foreground">
            S
          </span>
          <span
            className={cn(
              "font-display text-heading text-foreground transition-opacity duration-200",
              expanded ? "opacity-100" : "pointer-events-none opacity-0"
            )}
          >
            SalesRoom
          </span>
        </Link>

        {/* Nav */}
        <nav className="mt-4 flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon, tourId }) => {
            const item = (
              <Link
                key={href}
                href={href}
                {...(tourId ? { "data-tour": tourId } : {})}
                className={cn("group relative", railRowClass(expanded, isActivePath(pathname, href)))}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <RailLabel expanded={expanded}>{label}</RailLabel>
              </Link>
            );
            // Dark tooltip only when collapsed
            return expanded ? (
              item
            ) : (
              <Tooltip key={href}>
                <TooltipTrigger asChild>{item}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  {label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto flex flex-col gap-1">
          <button
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
            className={railRowClass(expanded)}
          >
            <PanelLeft className="h-[18px] w-[18px] shrink-0" />
            <RailLabel expanded={expanded}>Collapse</RailLabel>
          </button>

          <button
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light" : "Switch to dark"}
            className={railRowClass(expanded)}
          >
            <ThemeIcon className="h-[18px] w-[18px] shrink-0" />
            <RailLabel expanded={expanded}>{themeLabel}</RailLabel>
          </button>

          {/* User chip */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "mt-1 flex h-11 items-center rounded-lg text-left transition-colors hover:bg-card/70",
                    expanded ? "gap-2.5 px-1" : "justify-center"
                  )}
                >
                  <Avatar
                    name={user.name || user.email || "?"}
                    src={user.image}
                    size="sm"
                  />
                  <span
                    className={cn(
                      "overflow-hidden transition-all duration-200",
                      expanded
                        ? "min-w-0 flex-1 opacity-100"
                        : "pointer-events-none w-0 opacity-0"
                    )}
                  >
                    <span className="block truncate text-small font-medium text-foreground">
                      {user.name || "You"}
                    </span>
                    <span className="block truncate text-3xs uppercase tracking-wide text-tertiary">
                      {plan} plan
                    </span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-56">
                <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings?tab=billing">
                    <BarChart2 className="mr-2 h-4 w-4" /> Plan &amp; billing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </aside>

      {/* ── Floating main surface ── */}
      <main className="min-h-[calc(100vh-2rem)] min-w-0 flex-1 rounded-xl border border-border bg-card p-4 shadow-elevation-1 sm:p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
