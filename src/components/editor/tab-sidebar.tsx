"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { Plus, AlertCircle, X } from "lucide-react";
import { SortableTabItem } from "./sortable-tab-item";
import { StylePanel } from "./style-panel";
import { LinksEditor } from "./links-editor";
import type { TabData, PageLink } from "@/types";
import type { PageStyle } from "@/lib/page-styles";

interface TabSidebarProps {
  tabs: TabData[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onAddTab: () => void;
  onRenameTab: (tabId: string, name: string) => void;
  onDeleteTab: (tabId: string) => void;
  onReorderTabs: (tabIds: string[]) => void;
  pageStyle: PageStyle;
  onStyleChange: (patch: Partial<PageStyle>) => void;
  links: PageLink[];
  onLinksChange: (links: PageLink[]) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  tabLimitError?: string | null;
  onClearTabLimitError?: () => void;
  passwordProtection?: boolean;
  /** Mobile drawer state — when true the sidebar shows as an off-canvas drawer under md. */
  mobileOpen?: boolean;
  /** Called to close the mobile drawer (backdrop click / tab select / close button). */
  onMobileClose?: () => void;
}

export function TabSidebar({
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onRenameTab,
  onDeleteTab,
  onReorderTabs,
  pageStyle,
  onStyleChange,
  links,
  onLinksChange,
  password,
  onPasswordChange,
  tabLimitError,
  onClearTabLimitError,
  passwordProtection,
  mobileOpen = false,
  onMobileClose,
}: TabSidebarProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tabs.findIndex((t) => t.id === active.id);
    const newIndex = tabs.findIndex((t) => t.id === over.id);
    const newOrder = arrayMove(
      tabs.map((t) => t.id),
      oldIndex,
      newIndex
    );
    onReorderTabs(newOrder);
  };

  // Shared sidebar content — rendered in both the desktop in-flow column and
  // the mobile drawer so the two never drift. `selectTab` lets the mobile
  // drawer close itself after a tab is chosen.
  const inner = (selectTab: (tabId: string) => void) => (
    <>
      <div className="px-3 py-3 border-b border-border flex-shrink-0">
        <SectionLabel>Tabs</SectionLabel>
      </div>

      <div className="p-2 space-y-0.5 flex-shrink-0">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tabs.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {tabs.map((tab) => (
              <SortableTabItem
                key={tab.id}
                tab={tab}
                isActive={tab.id === activeTabId}
                canDelete={tabs.length > 1}
                onSelect={() => selectTab(tab.id)}
                onRename={(name) => onRenameTab(tab.id, name)}
                onDelete={() => onDeleteTab(tab.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <div className="p-2 border-t border-border flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start rounded-lg text-muted-foreground hover:text-foreground"
          onClick={onAddTab}
        >
          <Plus className="h-3.5 w-3.5 mr-2" />
          Add Tab
        </Button>
        {tabLimitError && (
          <div className="mt-1.5 flex items-start gap-1.5 px-2 py-1.5 rounded-lg bg-warning-subtle border border-warning/30">
            <AlertCircle className="h-3 w-3 text-warning shrink-0 mt-0.5" />
            <p className="text-2xs text-warning-subtle-foreground leading-tight flex-1">
              {tabLimitError}
            </p>
            {onClearTabLimitError && (
              <button
                onClick={onClearTabLimitError}
                className="shrink-0 text-warning hover:text-warning-subtle-foreground rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                aria-label="Dismiss"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-border flex-shrink-0">
        <LinksEditor links={links} onChange={onLinksChange} />
      </div>

      <div className="border-t border-border flex-shrink-0">
        <StylePanel
          style={pageStyle}
          onChange={onStyleChange}
          password={password}
          onPasswordChange={onPasswordChange}
          passwordProtection={passwordProtection}
        />
      </div>
    </>
  );

  return (
    <>
      {/* Desktop: in-flow sidebar (identical behavior at md+) */}
      <div className="hidden md:flex w-56 border-r border-border bg-background flex-col h-screen sticky top-0 overflow-y-auto">
        {inner(onSelectTab)}
      </div>

      {/* Mobile: off-canvas drawer under md */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          {/* Drawer panel */}
          <div className="absolute inset-y-0 left-0 z-40 w-72 max-w-[85vw] border-r border-border bg-background flex flex-col overflow-y-auto shadow-xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-end px-2 py-2 border-b border-border flex-shrink-0">
              <button
                onClick={onMobileClose}
                className="flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                aria-label="Close tabs & style"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {inner((tabId) => {
              onSelectTab(tabId);
              onMobileClose?.();
            })}
          </div>
        </div>
      )}
    </>
  );
}
