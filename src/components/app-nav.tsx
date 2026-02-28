"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LayoutGrid, BarChart2, Settings, FileText, LogOut } from "lucide-react";

const NAV_ITEMS = [
  { href: "/",            label: "Pages",       icon: LayoutGrid },
  { href: "/analytics",   label: "Analytics",   icon: BarChart2 },
  { href: "/submissions", label: "Submissions",  icon: FileText },
  { href: "/settings",    label: "Settings",    icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.push("/auth/signin");
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-primary">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-6">

        {/* Brand */}
        <Link
          href="/"
          className="font-bold text-base tracking-tight text-primary-foreground shrink-0 hover:opacity-80 transition-opacity"
        >
          SalesRoom
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-0.5">
          {NAV_ITEMS.map(({ href, label }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link key={href} href={href}>
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

        {/* User + sign-out */}
        {session?.user && (
          <div className="flex items-center gap-2 shrink-0">
            {/* Avatar circle */}
            <div className="w-7 h-7 rounded-full bg-primary-foreground/20 flex items-center justify-center overflow-hidden shrink-0">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-semibold text-primary-foreground">
                  {(session.user.name?.[0] ?? "?").toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-xs text-primary-foreground/70 hidden sm:block truncate max-w-[140px]">
              {session.user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs text-primary-foreground/70 hover:text-primary-foreground px-2 py-1.5 rounded-lg hover:bg-primary-foreground/10 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
