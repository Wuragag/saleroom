"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { AccountSettings } from "@/components/account-settings";
import { TeamSettings } from "@/components/team-settings";
import { BillingSettings } from "@/components/billing-settings";
import { User, Users, CreditCard, Paintbrush, Bell, Plug, Loader2 } from "lucide-react";

const TABS = [
  { id: "account", label: "Account", icon: User, ready: true },
  { id: "team", label: "Team", icon: Users, ready: true },
  { id: "billing", label: "Billing", icon: CreditCard, ready: true },
  { id: "branding", label: "Branding", icon: Paintbrush, ready: false },
  { id: "notifications", label: "Notifications", icon: Bell, ready: false },
  { id: "integrations", label: "Integrations", icon: Plug, ready: false },
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "account";
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      {/* Heading */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Settings
        </h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          Manage your account and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-border">
        {TABS.map(({ id, label, icon: Icon, ready }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {!ready && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                Soon
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "account" && <AccountSettings />}
      {activeTab === "team" && <TeamSettings />}
      {activeTab === "billing" && <BillingSettings />}

      {activeTab !== "account" && activeTab !== "team" && activeTab !== "billing" && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            {TABS.find((t) => t.id === activeTab)?.icon &&
              (() => {
                const TabIcon = TABS.find((t) => t.id === activeTab)!.icon;
                return (
                  <TabIcon className="h-5 w-5 text-muted-foreground" />
                );
              })()}
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            {TABS.find((t) => t.id === activeTab)?.label}
          </h3>
          <p className="text-sm text-muted-foreground">
            This section is coming soon.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-background">
      <AppNav />
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <SettingsContent />
      </Suspense>
    </main>
  );
}
