"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Users, Building2, BarChart2, Sparkles, Loader2 } from "lucide-react";
import { UsersPanel } from "@/components/admin/users-panel";
import { TeamsPanel } from "@/components/admin/teams-panel";
import { MetricsPanel } from "@/components/admin/metrics-panel";
import { ImportsPanel } from "@/components/admin/imports-panel";

const TABS = [
  { id: "users", label: "Users", icon: Users },
  { id: "teams", label: "Teams", icon: Building2 },
  { id: "imports", label: "Imports", icon: Sparkles },
  { id: "metrics", label: "Metrics", icon: BarChart2 },
];

function AdminContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "users";
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      {/* Heading */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Admin Dashboard
        </h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          Manage users, teams, and subscriptions
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-border">
        {TABS.map(({ id, label, icon: Icon }) => (
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
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "users" && <UsersPanel />}
      {activeTab === "teams" && <TeamsPanel />}
      {activeTab === "imports" && <ImportsPanel />}
      {activeTab === "metrics" && <MetricsPanel />}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
