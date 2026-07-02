"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { AccountSettings } from "@/components/account-settings";
import { TeamSettings } from "@/components/team-settings";
import { BillingSettings } from "@/components/billing-settings";
import { Card } from "@/components/ui/card";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
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
  const router = useRouter();
  const initialTab = searchParams.get("tab") || "account";
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    router.replace(`/settings?tab=${id}`, { scroll: false });
  };

  return (
    <PageContainer size="sm">
      {/* Heading */}
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
        className="mb-6"
      />

      {/* Tabs */}
      <div className="flex flex-nowrap items-center gap-1 mb-6 border-b border-border overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon, ready }) => (
          <button
            key={id}
            onClick={() => ready && handleTabChange(id)}
            disabled={!ready}
            aria-disabled={!ready}
            title={ready ? undefined : `${label} — coming soon`}
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              !ready
                ? "border-transparent text-muted-foreground/70 cursor-not-allowed"
                : activeTab === id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {!ready && (
              <span className="text-3xs font-semibold uppercase tracking-wider text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded-full">
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
        <Card className="p-12 text-center">
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
        </Card>
      )}
    </PageContainer>
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
