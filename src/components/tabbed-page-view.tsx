"use client";

import { useState } from "react";
import { PageRenderer } from "./page-renderer";
import { ExternalLink } from "lucide-react";

interface Tab {
  id: string;
  name: string;
  content: Record<string, unknown>;
}

interface Link {
  id: string;
  label: string;
  url: string;
}

interface TabbedPageViewProps {
  tabs: Tab[];
  links?: Link[];
  accentColor?: string;
  tabPlacement?: "top" | "left";
  isDark?: boolean;
}

export function TabbedPageView({
  tabs,
  links = [],
  accentColor = "#64748b",
  tabPlacement = "top",
  isDark = false,
}: TabbedPageViewProps) {
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id ?? "");
  // Key changes on tab switch to trigger CSS fade animation
  const [contentKey, setContentKey] = useState(0);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
  const showTabs = tabs.length > 1;
  const hasLinks = links.length > 0;

  const handleTabChange = (tabId: string) => {
    if (tabId === activeTabId) return;
    setActiveTabId(tabId);
    setContentKey((k) => k + 1);
    // Notify the buyer analytics tracker (decoupled via custom event)
    const tab = tabs.find((t) => t.id === tabId);
    window.dispatchEvent(
      new CustomEvent("sr:tab_view", {
        detail: { tabId, tabName: tab?.name ?? "" },
      })
    );
  };

  /** External links row — reused in both layouts */
  const LinksRow = () => (
    <div className="flex items-center gap-4 flex-wrap">
      {links.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm font-medium transition-all"
          style={{
            color: accentColor,
            fontFamily: "var(--font-syne, var(--font-montserrat), sans-serif)",
          }}
        >
          <ExternalLink className="h-3.5 w-3.5 opacity-60 flex-shrink-0" />
          {link.label}
        </a>
      ))}
    </div>
  );

  /* ── No tabs (single section) ── */
  if (!showTabs) {
    return (
      <div>
        {hasLinks && (
          <div className="mb-8">
            <LinksRow />
          </div>
        )}
        <div key={contentKey} className="pub-tab-content">
          {activeTab && (
            <PageRenderer content={activeTab.content} isDark={isDark} accentColor={accentColor} />
          )}
        </div>
      </div>
    );
  }

  /* ── Left placement ── */
  if (tabPlacement === "left") {
    return (
      <div className="flex gap-10">
        {/* Sticky left sidebar */}
        <nav className="flex-shrink-0 w-44 pt-0.5">
          <div className="sticky top-10 flex flex-col gap-0.5">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab?.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className="text-left px-3 py-2.5 text-sm font-medium rounded-lg transition-all"
                  style={{
                    fontFamily: "var(--font-dm-sans, var(--font-montserrat), sans-serif)",
                    color: isActive ? accentColor : "var(--pub-body-color)",
                    background: isActive ? `${accentColor}14` : "transparent",
                    borderLeft: isActive ? `2px solid ${accentColor}` : "2px solid transparent",
                  }}
                >
                  {tab.name}
                </button>
              );
            })}

            {hasLinks && (
              <div
                className="mt-4 pt-4 flex flex-col gap-0.5"
                style={{ borderTop: "1px solid var(--pub-divider)" }}
              >
                {links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                    style={{
                      color: accentColor,
                      fontFamily: "var(--font-dm-sans, var(--font-montserrat), sans-serif)",
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5 opacity-60 flex-shrink-0" />
                    <span className="truncate">{link.label}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div key={contentKey} className="pub-tab-content">
            {activeTab && (
              <PageRenderer content={activeTab.content} isDark={isDark} accentColor={accentColor} />
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Top placement (default) ── */
  return (
    <div>
      {/* Sticky tab bar */}
      <div
        className="sticky top-0 z-40 -mx-6 px-6 mb-10"
        style={{
          background: "var(--pub-tab-bg)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--pub-divider)",
        }}
      >
        <div className="pub-tab-bar flex items-center gap-0 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab?.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className="relative flex-shrink-0 px-4 py-3.5 text-sm font-medium transition-colors whitespace-nowrap"
                style={{
                  fontFamily: "var(--font-dm-sans, var(--font-montserrat), sans-serif)",
                  color: isActive
                    ? "var(--pub-heading-color)"
                    : "var(--pub-body-color)",
                }}
              >
                {/* Active background pill */}
                {isActive && (
                  <span
                    className="absolute inset-x-1.5 top-1.5 bottom-1.5 rounded-lg"
                    style={{ background: `${accentColor}14` }}
                    aria-hidden="true"
                  />
                )}
                <span className="relative z-10">{tab.name}</span>
                {/* Active underline */}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full"
                    style={{ background: accentColor }}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}

          {/* Links to the right */}
          {hasLinks && (
            <div
              className="flex items-center gap-3 ml-auto pl-4 flex-shrink-0"
              style={{ borderLeft: "1px solid var(--pub-divider)" }}
            >
              {links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 py-3.5 text-sm font-medium transition-colors whitespace-nowrap"
                  style={{
                    color: accentColor,
                    fontFamily: "var(--font-dm-sans, var(--font-montserrat), sans-serif)",
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tab content with fade-in on change */}
      <div key={contentKey} className="pub-tab-content">
        {activeTab && (
          <PageRenderer content={activeTab.content} isDark={isDark} accentColor={accentColor} />
        )}
      </div>
    </div>
  );
}
