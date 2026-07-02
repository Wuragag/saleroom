"use client";

import { useSession, signOut } from "next-auth/react";
import { AlertTriangle, LogOut } from "lucide-react";

export function ImpersonationBanner() {
  const { data: session } = useSession();

  if (!session?.user?.impersonatedBy) return null;

  return (
    // High-contrast warning bar (token-driven) so the admin always knows
    // they're in impersonation mode.
    <div
      role="status"
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 border-t-2 border-warning bg-warning px-5 py-2.5 text-warning-foreground shadow-[0_-4px_16px_rgba(0,0,0,0.18)]"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="text-sm font-semibold">
          Impersonating{" "}
          <strong className="underline underline-offset-2">
            {session.user.name ?? session.user.email}
          </strong>
          {session.user.impersonatedByEmail && (
            <span className="font-medium opacity-80">
              {" "}
              · as {session.user.impersonatedByEmail}
            </span>
          )}
        </span>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/auth/signin" })}
        className="flex items-center gap-1.5 rounded-lg bg-warning-foreground/10 px-3 py-1.5 text-sm font-semibold text-warning-foreground transition-colors hover:bg-warning-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning-foreground"
      >
        <LogOut className="h-3.5 w-3.5" />
        Stop Impersonating
      </button>
    </div>
  );
}
