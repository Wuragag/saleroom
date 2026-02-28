"use client";

import { useState } from "react";
import { AppNav } from "@/components/app-nav";
import { AccountSettings } from "@/components/account-settings";
import { User, Paintbrush, Bell, Plug } from "lucide-react";

const TABS = [
  { id: "account", label: "Account", icon: User, ready: true },
  { id: "branding", label: "Branding", icon: Paintbrush, ready: false },
  { id: "notifications", label: "Notifications", icon: Bell, ready: false },
  { id: "integrations", label: "Integrations", icon: Plug, ready: false },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("account");

  return (
    <main className="min-h-screen bg-background">
      <AppNav />
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

        {activeTab !== "account" && (
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
    </main>
  );
}
