"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ExternalLink } from "lucide-react";
import { buildTabAnchors, tabIdForHash } from "@/lib/tab-anchor";

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

export interface PublishedTab {
  id: string;
  name: string;
  /** Sanitized HTML rendered server-side by renderPubHtml (src/lib/pub-html.ts). */
  html: string;
}

interface Link {
  id: string;
  label: string;
  url: string;
}

interface TabbedPageViewProps {
  tabs: PublishedTab[];
  links?: Link[];
  accentColor?: string;
  tabPlacement?: "top" | "left";
}

const TAB_FONT = "var(--pub-font-body, var(--font-dm-sans, sans-serif))";

/**
 * Buyer-facing tab switcher. The content arrives as ready HTML per tab, so
 * switching is a pure DOM swap. Tabs follow the WAI-ARIA tabs pattern
 * (roving tabindex, arrow keys) and mirror into the URL hash so a section
 * can be deep-linked ("…#pricing").
 */
export function TabbedPageView({
  tabs,
  links = [],
  accentColor = "#64748b",
  tabPlacement = "top",
}: TabbedPageViewProps) {
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id ?? "");
  // Key changes on tab switch to trigger CSS fade animation
  const [contentKey, setContentKey] = useState(0);
  const anchors = useMemo(() => buildTabAnchors(tabs), [tabs]);
  const tabButtons = useRef(new Map<string, HTMLButtonElement>());

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
  const showTabs = tabs.length > 1;
  const hasLinks = links.length > 0;

  // Notify the buyer analytics tracker (decoupled via custom event)
  const notifyTracker = (tab: PublishedTab) => {
    window.dispatchEvent(
      new CustomEvent("sr:tab_view", {
        detail: { tabId: tab.id, tabName: tab.name },
      })
    );
  };

  // Deep link: "#pricing" opens the matching tab. The hash never reaches the
  // server, so the first tab is what gets server-rendered and the switch
  // happens on mount.
  useEffect(() => {
    const id = tabIdForHash(window.location.hash, anchors);
    if (!id || id === tabs[0]?.id) return;
    const tab = tabs.find((t) => t.id === id);
    if (!tab) return;
    setActiveTabId(id);
    setContentKey((k) => k + 1);
    notifyTracker(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (tabId: string) => {
    if (tabId === activeTabId) return;
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab) return;
    setActiveTabId(tabId);
    setContentKey((k) => k + 1);
    notifyTracker(tab);
    // Keep the URL shareable: the first tab is the bare link, others carry
    // their #anchor. replaceState so the back button isn't spammed.
    const { pathname, search } = window.location;
    const anchor = anchors.get(tabId);
    const url =
      tabId === tabs[0]?.id || !anchor
        ? `${pathname}${search}`
        : `${pathname}${search}#${anchor}`;
    window.history.replaceState(window.history.state, "", url);
  };

  // Roving tabindex + arrow-key navigation (WAI-ARIA tabs pattern)
  const handleTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const n = tabs.length;
    let next: number;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = (index + 1) % n;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = (index - 1 + n) % n;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = n - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    const tab = tabs[next];
    handleTabChange(tab.id);
    tabButtons.current.get(tab.id)?.focus();
  };

  const anchorFor = (tab: PublishedTab) => anchors.get(tab.id) ?? tab.id;

  /** ARIA + interaction props shared by both tab-bar layouts. */
  const tabProps = (tab: PublishedTab, index: number) => {
    const isActive = tab.id === activeTab?.id;
    const anchor = anchorFor(tab);
    return {
      id: `tab-${anchor}`,
      role: "tab" as const,
      "aria-selected": isActive,
      "aria-controls": `panel-${anchor}`,
      tabIndex: isActive ? 0 : -1,
      ref: (el: HTMLButtonElement | null) => {
        if (el) tabButtons.current.set(tab.id, el);
        else tabButtons.current.delete(tab.id);
      },
      onClick: () => handleTabChange(tab.id),
      onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => handleTabKeyDown(e, index),
    };
  };

  /* Tab content with fade-in on change. The HTML is already sanitized. */
  const panel = activeTab ? (
    <div
      key={contentKey}
      id={showTabs ? `panel-${anchorFor(activeTab)}` : undefined}
      role={showTabs ? "tabpanel" : undefined}
      aria-labelledby={showTabs ? `tab-${anchorFor(activeTab)}` : undefined}
      className="pub-tab-content"
    >
      <div className="pub-content" dangerouslySetInnerHTML={{ __html: activeTab.html }} />
    </div>
  ) : null;

  /** External links row — reused in both layouts */
  const linksRow = (
    <div className="flex items-center gap-4 flex-wrap">
      {links.map((link) => (
        <a
          key={link.id}
          href={sanitizeUrl(link.url)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm font-medium transition-all"
          style={{ color: accentColor, fontFamily: TAB_FONT }}
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
        {hasLinks && <div className="mb-8">{linksRow}</div>}
        {panel}
      </div>
    );
  }

  /* ── Left placement ── */
  /* Desktop: sticky sidebar rail. Mobile: the rail collapses into a
     horizontally scrollable pill row above the content. */
  if (tabPlacement === "left") {
    return (
      <div className="flex flex-col md:flex-row gap-6 md:gap-10">
        {/* Tab rail */}
        <nav className="w-full md:w-44 md:flex-shrink-0 md:pt-0.5" aria-label="Page sections">
          <div
            className="pub-tab-bar md:sticky md:top-10 flex flex-row md:flex-col gap-1.5 md:gap-0.5 overflow-x-auto md:overflow-visible -mx-6 px-6 md:mx-0 md:px-0 pb-1 md:pb-0"
            role="tablist"
          >
            {tabs.map((tab, index) => {
              const isActive = tab.id === activeTab?.id;
              return (
                <button
                  key={tab.id}
                  {...tabProps(tab, index)}
                  className="text-left px-3 py-2.5 text-sm rounded-lg transition-all flex-shrink-0 whitespace-nowrap md:whitespace-normal md:w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  style={{
                    fontFamily: TAB_FONT,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive
                      ? "var(--pub-heading-color)"
                      : "var(--pub-body-color)",
                    background: isActive ? "var(--pub-surface)" : "transparent",
                  }}
                >
                  {tab.name}
                </button>
              );
            })}

            {hasLinks && (
              <div
                className="hidden md:flex mt-4 pt-4 flex-col gap-0.5"
                style={{ borderTop: "1px solid var(--pub-divider)" }}
              >
                {links.map((link) => (
                  <a
                    key={link.id}
                    href={sanitizeUrl(link.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                    style={{ color: accentColor, fontFamily: TAB_FONT }}
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
          {hasLinks && <div className="mb-6 md:hidden">{linksRow}</div>}
          {panel}
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
        <div
          className="pub-tab-bar flex items-center gap-0 overflow-x-auto"
          role="tablist"
          aria-label="Page sections"
        >
          {tabs.map((tab, index) => {
            const isActive = tab.id === activeTab?.id;
            return (
              <button
                key={tab.id}
                {...tabProps(tab, index)}
                className="relative flex-shrink-0 px-1 mr-6 py-4 text-[0.9375rem] transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                style={{
                  fontFamily: TAB_FONT,
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
                    className="absolute -bottom-px left-0 right-0 h-[2px] rounded-full"
                    style={{ background: "var(--pub-heading-color)" }}
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
                  style={{ color: accentColor, fontFamily: TAB_FONT }}
                >
                  <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {panel}
    </div>
  );
}
