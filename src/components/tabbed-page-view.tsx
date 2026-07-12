"use client";

import { useState } from "react";
import { PageRenderer } from "./page-renderer";
import { ExternalLink } from "lucide-react";

/** Sanitize a URL to prevent javascript: and data: XSS attacks */
function sanitizeUrl(url: string): string {
  if (!url) return "#";
  const trimmed = url.trim();
  // Block dangerous protocols
  if (/^\s*(javascript|data|vbscript)\s*:/i.test(trimmed)) return "#";
  // Auto-prefix protocol-less URLs
  if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith("/") && !trimmed.startsWith("mailto:") && !trimmed.startsWith("tel:")) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

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
          href={sanitizeUrl(link.url)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm font-medium transition-all"
          style={{
            color: accentColor,
            fontFamily: "var(--pub-font-body, var(--font-dm-sans, sans-serif))",
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
          <div className="pub-tab-bar sticky top-10 flex flex-col gap-0.5">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab?.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className="text-left px-3 py-2.5 text-sm rounded-lg transition-all w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  style={{
                    fontFamily: "var(--pub-font-body, var(--font-dm-sans, sans-serif))",
                    fontWeight: isActive ? 600 : 500,
                    color: isActive
                      ? "var(--pub-heading-color)"
                      : "var(--pub-muted-color)",
                    background: isActive ? "var(--pub-surface)" : "transparent",
                    boxShadow: isActive
                      ? "inset 2px 0 0 var(--pub-accent-safe, var(--pub-heading-color))"
                      : "none",
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
                    href={sanitizeUrl(link.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                    style={{
                      color: accentColor,
                      fontFamily: "var(--pub-font-body, var(--font-dm-sans, sans-serif))",
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
                className="relative flex-shrink-0 px-1 mr-6 py-4 text-[0.9375rem] transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                style={{
                  fontFamily: "var(--pub-font-body, var(--font-dm-sans, sans-serif))",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive
                    ? "var(--pub-heading-color)"
                    : "var(--pub-body-color)",
                }}
              >
                <span className="relative z-10">{tab.name}</span>
                {/* Prominent active underline (overlaps the bar hairline) */}
                {isActive && (
                  <span
                    className="pub-tab-underline absolute -bottom-px left-0 right-0 h-[2px] rounded-full"
                    style={{ background: "var(--pub-accent-safe, var(--pub-heading-color))" }}
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
                  href={sanitizeUrl(link.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 py-3.5 text-sm font-medium transition-colors whitespace-nowrap"
                  style={{
                    color: accentColor,
                    fontFamily: "var(--pub-font-body, var(--font-dm-sans, sans-serif))",
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
