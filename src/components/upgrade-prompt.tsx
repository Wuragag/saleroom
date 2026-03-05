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
      }
    } catch {
      toast.error("Failed to start checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 ${className}`}
    >
      <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
      <p className="text-sm text-amber-800 dark:text-amber-200 flex-1">
        {message}
      </p>
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition-colors disabled:opacity-50"
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
