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
  // The fixed sidebar only exists from `md:` up; on narrower screens the tabs
  // collapse into a horizontal, scrollable row above the content.
  if (tabPlacement === "left") {
    return (
      <div className="flex flex-col gap-6 md:flex-row md:gap-10">
        {/* Horizontal tab row (mobile) / sticky left sidebar (md+) */}
        <nav className="md:w-44 md:flex-shrink-0 md:pt-0.5">
          <div className="pub-tab-bar flex gap-1 overflow-x-auto md:sticky md:top-10 md:flex-col md:gap-0.5 md:overflow-x-visible">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab?.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className="text-left px-3 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap flex-shrink-0 md:w-full md:flex-shrink md:whitespace-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  style={{
                    fontFamily: "var(--font-dm-sans, var(--font-montserrat), sans-serif)",
                    color: isActive ? accentColor : "var(--pub-body-color)",
                    background: isActive ? `${accentColor}18` : "transparent",
                  }}
                >
                  {tab.name}
                </button>
              );
            })}

            {hasLinks && (
              <div
                className="flex gap-1 ml-1 pl-2 border-l md:flex-col md:gap-0.5 md:ml-0 md:pl-0 md:mt-4 md:pt-4 md:border-l-0 md:border-t"
                style={{ borderColor: "var(--pub-divider)" }}
              >
                {links.map((link) => (
                  <a
                    key={link.id}
                    href={sanitizeUrl(link.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0 md:flex-shrink md:whitespace-normal"
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
                className="relative flex-shrink-0 px-4 py-3.5 text-sm font-medium transition-colors whitespace-nowrap rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                  href={sanitizeUrl(link.url)}
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
