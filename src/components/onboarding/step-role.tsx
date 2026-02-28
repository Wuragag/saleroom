"use client";

import { useState } from "react";
import {
  Briefcase,
  Phone,
  Heart,
  Users,
  Zap,
  ArrowRight,
  Loader2,
} from "lucide-react";
import type { OnboardingRole } from "./onboarding-flow";

const ROLES: {
  id: OnboardingRole;
  icon: React.ElementType;
  title: string;
  subtitle: string;
}[] = [
  {
    id: "ae",
    icon: Briefcase,
    title: "Account Executive",
    subtitle: "I close deals",
  },
  {
    id: "sdr",
    icon: Phone,
    title: "Sales Development Rep",
    subtitle: "I book meetings",
  },
  {
    id: "csm",
    icon: Heart,
    title: "Customer Success",
    subtitle: "I onboard & retain",
  },
  {
    id: "manager",
    icon: Users,
    title: "Sales Manager",
    subtitle: "I run a team",
  },
  {
    id: "founder",
    icon: Zap,
    title: "Founder / Solo",
    subtitle: "I do everything",
  },
];

interface Props {
  userName: string;
  selected: OnboardingRole;
  onSelect: (role: OnboardingRole) => void;
  onComplete: (role: OnboardingRole) => void;
}

export function StepRole({ userName, selected, onSelect, onComplete }: Props) {
  const [loading, setLoading] = useState(false);

  const firstName = userName.split(" ")[0];

  async function handleContinue() {
    if (!selected) return;
    setLoading(true);
    await onComplete(selected);
    setLoading(false);
  }

  return (
    <div className="w-full max-w-lg">
      {/* Headline */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome, {firstName}! 👋
        </h1>
        <p className="text-muted-foreground mt-2 text-base leading-relaxed">
          One quick question before we get started.
          <br />
          What best describes you?
        </p>
      </div>

      {/* Role cards */}
      <div className="space-y-2.5">
        {ROLES.map(({ id, icon: Icon, title, subtitle }) => {
          const isSelected = selected === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 text-left transition-all duration-150 ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-4.5 w-4.5" style={{ width: "1.125rem", height: "1.125rem" }} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-none mb-1 text-foreground">
                  {title}
                </p>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              </div>

              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  isSelected
                    ? "border-primary bg-primary"
                    : "border-border bg-background"
                }`}
              >
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Continue button */}
      <div className="mt-8">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selected || loading}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Setting up…
            </>
          ) : (
            <>
              Get started
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        {!selected && (
          <p className="text-center text-xs text-muted-foreground mt-3">
            Select your role to continue
          </p>
        )}
      </div>
    </div>
  );
}
