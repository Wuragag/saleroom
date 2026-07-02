"use client";

import { useState } from "react";
import { Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UpgradePromptProps {
  message: string;
  targetPlan?: "PRO" | "TEAM";
  className?: string;
}

export function UpgradePrompt({
  message,
  targetPlan = "PRO",
  className = "",
}: UpgradePromptProps) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: targetPlan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error ?? "Failed to start checkout");
      }
    } catch {
      toast.error("Failed to start checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-warning-subtle border border-warning/30 ${className}`}
    >
      <Zap className="h-4 w-4 text-warning shrink-0" />
      <p className="text-sm text-warning-subtle-foreground flex-1">
        {message}
      </p>
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="shrink-0 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-warning-subtle-foreground hover:text-foreground transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <>
            Upgrade to {targetPlan === "TEAM" ? "Team" : "Pro"} →
          </>
        )}
      </button>
    </div>
  );
}
