"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  CreditCard,
  Check,
  X,
  Loader2,
  Zap,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BillingData {
  plan: "FREE" | "PRO" | "TEAM";
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  usage: {
    pages: { current: number; limit: number };
    members: { current: number; limit: number };
    aiCredits: { current: number; limit: number };
  };
  features: {
    passwordProtection: boolean;
    canInvite: boolean;
  };
}

const PLAN_LABELS: Record<BillingData["plan"], string> = {
  FREE: "Free plan",
  PRO: "Pro",
  TEAM: "Team",
};

const PLAN_CARDS = [
  {
    plan: "FREE" as const,
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      { text: "1 page", included: true },
      { text: "3 tabs per page", included: true },
      { text: "Password protection", included: false },
      { text: "Team invites", included: false },
    ],
  },
  {
    plan: "PRO" as const,
    name: "Pro",
    price: "$19",
    period: "/month",
    popular: true,
    features: [
      { text: "Unlimited pages", included: true },
      { text: "Unlimited tabs", included: true },
      { text: "Password protection", included: true },
      { text: "Up to 3 team members", included: true },
    ],
  },
  {
    plan: "TEAM" as const,
    name: "Team",
    price: "$49",
    period: "/month",
    features: [
      { text: "Unlimited pages", included: true },
      { text: "Unlimited tabs", included: true },
      { text: "Password protection", included: true },
      { text: "Unlimited team members", included: true },
    ],
  },
];

export function BillingSettings() {
  const { update: refreshSession } = useSession();
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBilling = useCallback(async () => {
    try {
      const data = await apiClient.get<BillingData>("/api/billing/status");
      setBilling(data);
    } catch (err) {
      console.error("Failed to fetch billing:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  // After Stripe checkout redirect, refresh the session to pick up new plan
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("session_id")) {
      // Stripe checkout completed — refresh session and billing data
      refreshSession();
      fetchBilling();
      // Clean the URL
      window.history.replaceState({}, "", "/settings?tab=billing");
    }
  }, [refreshSession, fetchBilling]);

  const handleCheckout = async (plan: "PRO" | "TEAM") => {
    setCheckoutLoading(plan);
    setError(null);
    try {
      const data = await apiClient.post<{ url?: string }>("/api/billing/checkout", { plan });
      if (data?.url) {
        window.location.href = data.url;
      } else {
        const msg = "Failed to start checkout";
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to start checkout. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    setError(null);
    try {
      const data = await apiClient.post<{ url?: string }>("/api/billing/portal");
      if (data?.url) {
        window.location.href = data.url;
      } else {
        const msg = "Failed to open billing portal";
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to open billing portal. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!billing) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        Failed to load billing information.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current plan header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Current Plan
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-2xl font-bold text-foreground">
                {PLAN_LABELS[billing.plan] ?? billing.plan}
              </span>
              <Badge
                variant={
                  billing.status === "ACTIVE"
                    ? "success"
                    : billing.status === "PAST_DUE"
                    ? "danger"
                    : "neutral"
                }
                className="rounded-full font-medium"
              >
                {billing.status}
              </Badge>
            </div>
          </div>
          {billing.plan !== "FREE" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePortal}
              disabled={portalLoading}
              className="text-primary hover:text-primary/80"
            >
              {portalLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ExternalLink className="h-3.5 w-3.5" />
              )}
              Manage Billing
            </Button>
          )}
        </div>

        {/* Cancellation notice */}
        {billing.cancelAtPeriodEnd && billing.currentPeriodEnd && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-warning-subtle border border-warning/30">
            <AlertCircle className="h-4 w-4 text-warning shrink-0" />
            <p className="text-sm text-warning-subtle-foreground">
              Your plan is set to cancel on{" "}
              {new Date(billing.currentPeriodEnd).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              . You&apos;ll keep access until then.
            </p>
          </div>
        )}
      </Card>

      {/* Usage meters */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Usage</h3>
        <div className="space-y-4">
          <UsageMeter
            label="Pages"
            current={billing.usage.pages.current}
            limit={billing.usage.pages.limit}
          />
          <UsageMeter
            label="Team members"
            current={billing.usage.members.current}
            limit={billing.usage.members.limit}
          />
          <UsageMeter
            label="AI credits"
            current={billing.usage.aiCredits.current}
            limit={billing.usage.aiCredits.limit}
          />
        </div>
      </Card>

      {/* Plan comparison */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Choose a plan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLAN_CARDS.map((card) => {
            const isCurrent = billing.plan === card.plan;
            const isUpgrade =
              (billing.plan === "FREE" && card.plan !== "FREE") ||
              (billing.plan === "PRO" && card.plan === "TEAM");
            const isDowngrade =
              (billing.plan === "TEAM" && card.plan !== "TEAM") ||
              (billing.plan === "PRO" && card.plan === "FREE");

            return (
              <Card
                key={card.plan}
                className={`relative p-5 flex flex-col ${
                  card.popular
                    ? "border-primary shadow-sm ring-1 ring-primary/20"
                    : ""
                }`}
              >
                {card.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-3xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full">
                    Popular
                  </span>
                )}

                <h4 className="text-base font-semibold text-foreground">
                  {card.name}
                </h4>
                <div className="mt-1 mb-4">
                  <span className="text-2xl font-bold text-foreground">
                    {card.price}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {card.period}
                  </span>
                </div>

                <ul className="space-y-2 flex-1">
                  {card.features.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm text-foreground"
                    >
                      {f.included ? (
                        <Check className="h-3.5 w-3.5 text-success shrink-0" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={f.included ? "" : "text-muted-foreground"}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4">
                  {isCurrent ? (
                    <div className="w-full py-2 text-center text-sm font-medium text-muted-foreground bg-muted rounded-lg">
                      Current plan
                    </div>
                  ) : isUpgrade ? (
                    <Button
                      onClick={() => handleCheckout(card.plan as "PRO" | "TEAM")}
                      disabled={!!checkoutLoading}
                      className="w-full"
                    >
                      {checkoutLoading === card.plan ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Zap className="h-3.5 w-3.5" />
                      )}
                      {checkoutLoading === card.plan
                        ? "Redirecting…"
                        : `Upgrade to ${card.name}`}
                    </Button>
                  ) : isDowngrade ? (
                    <Button
                      variant="outline"
                      onClick={handlePortal}
                      disabled={portalLoading}
                      className="w-full text-muted-foreground"
                    >
                      Manage in Portal
                    </Button>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Usage Meter ────────────────────────────────────────────────────────────

function UsageMeter({
  label,
  current,
  limit,
}: {
  label: string;
  current: number;
  limit: number;
}) {
  const isUnlimited = limit === -1;
  const percent = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);
  const isAtLimit = !isUnlimited && current >= limit;

  // Threshold color driven by usage data — mapped to design tokens.
  const barColor = isAtLimit
    ? "hsl(var(--destructive))"
    : percent > 80
    ? "hsl(var(--warning))"
    : "hsl(var(--primary))";

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-foreground font-medium">{label}</span>
        <span className="text-muted-foreground">
          {current} / {isUnlimited ? "∞" : limit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: isUnlimited ? "0%" : `${percent}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
    </div>
  );
}
