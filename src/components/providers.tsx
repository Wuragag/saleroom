"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { ImpersonationBanner } from "@/components/impersonation-banner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <ImpersonationBanner />
      <Toaster richColors position="bottom-right" />
    </SessionProvider>
  );
}
