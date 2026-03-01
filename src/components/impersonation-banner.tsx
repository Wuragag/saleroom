"use client";

import { useSession, signOut } from "next-auth/react";
import { AlertTriangle, LogOut } from "lucide-react";

export function ImpersonationBanner() {
  const { data: session } = useSession();

  if (!session?.user?.impersonatedBy) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 bg-amber-500 px-5 py-2.5 shadow-lg">
      <div className="flex items-center gap-2 text-white">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">
          Impersonating{" "}
          <strong>{session.user.name ?? session.user.email}</strong>
          {session.user.impersonatedByEmail && (
            <span className="font-normal opacity-80">
              {" "}
              · as {session.user.impersonatedByEmail}
            </span>
          )}
        </span>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/auth/signin" })}
        className="flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-white/30"
      >
        <LogOut className="h-3.5 w-3.5" />
        Stop Impersonating
      </button>
    </div>
  );
}
