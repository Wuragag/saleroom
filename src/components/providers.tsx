"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ImpersonationBanner } from "@/components/impersonation-banner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TooltipProvider delayDuration={300}>
        {children}
        <ImpersonationBanner />
        <Toaster
          position="bottom-right"
          duration={4200}
          visibleToasts={5}
          closeButton
          toastOptions={{
            classNames: {
              toast:
                "!bg-card !border !border-border !text-foreground !rounded-xl !shadow-elevation-3 !gap-3",
              title: "!text-small !font-semibold !text-foreground",
              description: "!text-2xs !text-muted-foreground",
              icon: "!m-0",
              closeButton:
                "!bg-card !border-border !text-muted-foreground hover:!text-foreground",
              success: "!text-success",
              error: "!text-destructive",
              warning: "!text-warning",
              info: "!text-info",
            },
          }}
        />
      </TooltipProvider>
    </SessionProvider>
  );
}
