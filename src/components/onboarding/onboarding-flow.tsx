"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/api-client";
import { StepRole } from "./step-role";

export type OnboardingRole =
  | "ae"
  | "sdr"
  | "csm"
  | "manager"
  | "founder"
  | null;

interface Props {
  userName: string;
}

export function OnboardingFlow({ userName }: Props) {
  const { update } = useSession();
  const [role, setRole] = useState<OnboardingRole>(null);

  async function handleComplete(selectedRole: OnboardingRole) {
    try {
      await apiClient.patch("/api/onboarding", { role: selectedRole, onboardingCompleted: true });
    } catch {
      toast.error("Something went wrong. Please try again.");
      return;
    }

    // Refresh the JWT so middleware sees onboardingCompleted: true
    await update();
    // Hard navigation ensures the browser sends the freshly-set cookie
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-1 bg-border">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: "100%" }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-end px-6 py-4 max-w-2xl mx-auto w-full">
        <span className="text-xs font-semibold text-foreground tracking-tight">
          SalesRoom
        </span>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <StepRole
          userName={userName}
          selected={role}
          onSelect={setRole}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}
