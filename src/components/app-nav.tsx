"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutGrid,
  BarChart2,
  Settings,
  FileText,
  Blocks,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  tourId?: string;
}[] = [
  { href: "/", label: "Pages", icon: LayoutGrid },
  { href: "/analytics", label: "Analytics", icon: BarChart2, tourId: "nav-analytics" },
  { href: "/submissions", label: "Submissions", icon: FileText },
  { href: "/library", label: "Library", icon: Blocks },
  { href: "/settings", label: "Settings", icon: Settings, tourId: "nav-settings" },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    setMobileOpen(false);
    await signOut({ redirect: false });
    router.push("/auth/signin");
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-primary">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-6">
          {/* Brand */}
          <Link
            href="/"
            className="font-bold text-base tracking-tight text-primary-foreground shrink-0 hover:opacity-80 transition-opacity"
          >
            SalesRoom
          </Link>
          {/* Plan badge for free users */}
          {session?.user?.plan === "FREE" && (
            <Link
              href="/settings?tab=billing"
              className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/60 bg-primary-foreground/10 px-2 py-0.5 rounded-full hover:bg-primary-foreground/20 transition-colors"
            >
              Free
            </Link>
          )}

          {/* Desktop nav links — hidden on mobile */}
          <nav className="hidden md:flex items-center gap-0.5">
            {NAV_ITEMS.map(({ href, label, tourId }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link key={href} href={href} {...(tourId ? { "data-tour": tourId } : {})}>
                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      isActive
                        ? "bg-primary-foreground/15 text-primary-foreground"
                        : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* User + sign-out (desktop) */}
          {session?.user && (
            <div className="hidden md:flex items-center gap-2 shrink-0">
              {/* Avatar circle */}
              <div className="w-7 h-7 rounded-full bg-primary-foreground/20 flex items-center justify-center overflow-hidden shrink-0">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt=""
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold text-primary-foreground">
                    {(session.user.name?.[0] ?? "?").toUpperCase()}
                  </span>
                )}
              </div>
              <span className="text-xs text-primary-foreground/70 truncate max-w-[140px]">
                {session.user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-xs text-primary-foreground/70 hover:text-primary-foreground px-2 py-1.5 rounded-lg hover:bg-primary-foreground/10 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          )}

          {/* Mobile hamburger button */}
          <button
            className="md:hidden flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/10 rounded-lg p-1.5 transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* ── Mobile Menu Overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />

          {/* Panel */}
          <nav className="absolute top-0 right-0 bottom-0 w-64 bg-primary flex flex-col shadow-xl animate-in slide-in-from-right duration-200">
            {/* Close button */}
            <div className="flex items-center justify-between px-5 h-14 shrink-0">
              <span className="font-bold text-base text-primary-foreground">
                SalesRoom
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-primary-foreground hover:bg-primary-foreground/10 rounded-lg p-1.5 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav items */}
            <div className="flex flex-col gap-1 px-3 py-2">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const isActive =
                  href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
                    <span
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary-foreground/15 text-primary-foreground"
                          : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* User section at bottom */}
            {session?.user && (
              <div className="border-t border-primary-foreground/10 px-4 py-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center overflow-hidden shrink-0">
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt=""
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-semibold text-primary-foreground">
                        {(session.user.name?.[0] ?? "?").toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-primary-foreground truncate">
                      {session.user.name || "User"}
                    </p>
                    <p className="text-xs text-primary-foreground/60 truncate">
                      {session.user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 w-full text-sm text-primary-foreground/70 hover:text-primary-foreground px-3 py-2 rounded-lg hover:bg-primary-foreground/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
