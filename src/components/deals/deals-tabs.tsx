"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/deals", label: "Pipeline" },
  { href: "/deals/contacts", label: "Contacts" },
  { href: "/deals/companies", label: "Companies" },
];

/** Underline sub-tabs for the Deals area (settings-page idiom). */
export function DealsTabs() {
  const pathname = usePathname();

  return (
    <div className="mt-4 flex items-center gap-4 border-b border-border">
      {TABS.map((tab) => {
        // Pipeline also owns /deals/[id]; the other tabs are exact matches.
        const active =
          tab.href === "/deals"
            ? pathname === "/deals" ||
              (pathname.startsWith("/deals/") &&
                !TABS.some((t) => t.href !== "/deals" && pathname.startsWith(t.href)))
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "-mb-px border-b-2 px-0.5 pb-2 text-sm transition-colors",
              active
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
