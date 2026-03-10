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

  return (
    <div className="w-56 border-r border-border bg-background flex flex-col h-screen sticky top-0 overflow-y-auto">
      <div className="px-3 py-3 border-b border-border flex-shrink-0">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          Tabs
        </h3>
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
                onSelect={() => onSelectTab(tab.id)}
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
          <div className="mt-1.5 flex items-start gap-1.5 px-2 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-tight flex-1">
              {tabLimitError}
            </p>
            {onClearTabLimitError && (
              <button
                onClick={onClearTabLimitError}
                className="shrink-0 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
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
    </div>
  );
}
