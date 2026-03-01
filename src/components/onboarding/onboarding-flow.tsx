"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
  const router = useRouter();
  const { update } = useSession();
  const [role, setRole] = useState<OnboardingRole>(null);

  async function handleComplete(selectedRole: OnboardingRole) {
    await fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: selectedRole, onboardingCompleted: true }),
    });
    // Refresh the JWT so middleware sees onboardingCompleted: true
    await update();
    router.push("/");
    router.refresh();
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
