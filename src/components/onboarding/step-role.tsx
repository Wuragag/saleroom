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
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

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
        <p className="text-caption font-semibold uppercase text-muted-foreground mb-2">
          Welcome aboard
        </p>
        <h1 className="font-display text-display text-foreground">
          Hi {firstName} — let’s set the scene
        </h1>
        <p className="text-muted-foreground mt-2 text-body leading-relaxed">
          One quick question so we can tailor {APP_NAME} to you.
          <br />
          What best describes your role?
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
                  ? "border-primary bg-muted shadow-elevation-1"
                  : "border-border bg-card hover:border-border-strong hover:bg-muted/40"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon style={{ width: "1.125rem", height: "1.125rem" }} />
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
        <Button
          type="button"
          size="lg"
          onClick={handleContinue}
          disabled={!selected || loading}
          className="w-full font-semibold"
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
        </Button>

        {!selected && (
          <p className="text-center text-xs text-muted-foreground mt-3">
            Select your role to continue
          </p>
        )}
      </div>
    </div>
  );
}
