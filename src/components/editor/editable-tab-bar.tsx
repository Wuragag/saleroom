"use client";

import { useState, useRef, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExternalLink, Plus, X, Pencil, AlertCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LinksEditor } from "./links-editor";
import type { TabData, PageLink } from "@/types";

/**
 * The page's tab bar rendered exactly where (and how) visitors see it —
 * mirrors TabbedPageView's top/left tab bars — but wired to the editor:
 * click to switch, double-click to rename, drag to reorder, hover "×" to
 * delete, "+" to add, and a pencil popover to edit the external links.
 */

interface EditableTabBarProps {
  tabs: TabData[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onAddTab: () => void;
  onRenameTab: (tabId: string, name: string) => void;
  onDeleteTab: (tabId: string) => void;
  onReorderTabs: (tabIds: string[]) => void;
  links: PageLink[];
  onLinksChange: (links: PageLink[]) => void;
  accentColor: string;
  tabPlacement: "top" | "left";
  readOnly?: boolean;
  tabLimitError?: string | null;
  onClearTabLimitError?: () => void;
}

const TAB_FONT = "var(--font-dm-sans, var(--font-montserrat), sans-serif)";

/* ── Inline rename input, shared by both placements ── */
function RenameInput({
  name,
  onCommit,
  onCancel,
  className,
  style,
}: {
  name: string;
  onCommit: (name: string) => void;
  onCancel: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [value, setValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const finish = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== name) onCommit(trimmed);
    else onCancel();
  };

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={finish}
      onKeyDown={(e) => {
        if (e.key === "Enter") finish();
        if (e.key === "Escape") onCancel();
      }}
      onClick={(e) => e.stopPropagation()}
      size={Math.max(value.length, 4)}
      aria-label="Rename tab"
      className={className}
      style={style}
    />
  );
}

/* ── One sortable tab (top placement) ── */
function SortableTopTab({
  tab,
  isActive,
  accentColor,
  readOnly,
  canDelete,
  onSelect,
  onRename,
  onDelete,
}: {
  tab: TabData;
  isActive: boolean;
  accentColor: string;
  readOnly?: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: tab.id, disabled: !!readOnly || editing });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="group relative flex-shrink-0 flex items-center"
    >
      {editing ? (
        <RenameInput
          name={tab.name}
          onCommit={(name) => {
            onRename(name);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
          className="mx-4 my-3 px-1 text-sm font-medium bg-transparent outline-none border-b"
          style={{
            fontFamily: TAB_FONT,
            color: "var(--pub-heading-color)",
            borderColor: accentColor,
          }}
        />
      ) : (
        <button
          onClick={onSelect}
          onDoubleClick={
            readOnly
              ? undefined
              : (e) => {
                  e.preventDefault();
                  setEditing(true);
                }
          }
          {...(!readOnly ? { ...attributes, ...listeners } : {})}
          title={readOnly ? undefined : "Double-click to rename, drag to reorder"}
          className="relative px-4 py-3.5 text-sm font-medium transition-colors whitespace-nowrap rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          style={{
            fontFamily: TAB_FONT,
            color: isActive ? "var(--pub-heading-color)" : "var(--pub-body-color)",
            cursor: readOnly ? "pointer" : undefined,
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
      )}

      {/* Hover delete chip */}
      {!readOnly && canDelete && !editing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={`Delete tab ${tab.name}`}
          className="absolute -top-0.5 -right-0.5 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-background border border-border text-muted-foreground shadow-sm opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-destructive transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
}

/* ── One sortable tab (left placement) ── */
function SortableLeftTab({
  tab,
  isActive,
  accentColor,
  readOnly,
  canDelete,
  onSelect,
  onRename,
  onDelete,
}: {
  tab: TabData;
  isActive: boolean;
  accentColor: string;
  readOnly?: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: tab.id, disabled: !!readOnly || editing });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="group relative w-full"
    >
      {editing ? (
        <RenameInput
          name={tab.name}
          onCommit={(name) => {
            onRename(name);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
          className="w-full px-3 py-2.5 text-sm font-medium bg-transparent outline-none border-b rounded-none"
          style={{
            fontFamily: TAB_FONT,
            color: "var(--pub-heading-color)",
            borderColor: accentColor,
          }}
        />
      ) : (
        <button
          onClick={onSelect}
          onDoubleClick={
            readOnly
              ? undefined
              : (e) => {
                  e.preventDefault();
                  setEditing(true);
                }
          }
          {...(!readOnly ? { ...attributes, ...listeners } : {})}
          title={readOnly ? undefined : "Double-click to rename, drag to reorder"}
          className="text-left px-3 py-2.5 text-sm font-medium rounded-lg transition-all w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          style={{
            fontFamily: TAB_FONT,
            color: isActive ? accentColor : "var(--pub-body-color)",
            background: isActive ? `${accentColor}18` : "transparent",
          }}
        >
          <span className="block truncate pr-4">{tab.name}</span>
        </button>
      )}

      {/* Hover delete chip */}
      {!readOnly && canDelete && !editing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={`Delete tab ${tab.name}`}
          className="absolute top-1/2 -translate-y-1/2 right-1.5 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-background border border-border text-muted-foreground shadow-sm opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-destructive transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
}

/* ── Links display + edit popover ── */
function EditableLinks({
  links,
  onLinksChange,
  accentColor,
  readOnly,
  layout,
}: {
  links: PageLink[];
  onLinksChange: (links: PageLink[]) => void;
  accentColor: string;
  readOnly?: boolean;
  layout: "top" | "left";
}) {
  const [open, setOpen] = useState(false);
  const hasLinks = links.length > 0;

  if (readOnly && !hasLinks) return null;

  const editButton = !readOnly && (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label="Edit links"
          className={`flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-all rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            hasLinks
              ? "h-6 w-6 justify-center opacity-0 group-hover/links:opacity-100 focus-visible:opacity-100"
              : "px-2 py-1 text-xs font-medium border border-dashed border-border/80 bg-background/60 backdrop-blur-sm"
          } ${open ? "!opacity-100" : ""}`}
        >
          <Pencil className="h-3 w-3" />
          {!hasLinks && "Add links"}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <LinksEditor links={links} onChange={onLinksChange} />
      </PopoverContent>
    </Popover>
  );

  if (layout === "left") {
    return (
      <div
        className="group/links mt-4 pt-4 flex flex-col gap-0.5"
        style={{ borderTop: "1px solid var(--pub-divider)" }}
      >
        {links.map((link) => (
          <span
            key={link.id}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg"
            style={{ color: accentColor, fontFamily: TAB_FONT }}
          >
            <ExternalLink className="h-3.5 w-3.5 opacity-60 flex-shrink-0" />
            <span className="truncate">{link.label}</span>
          </span>
        ))}
        <div className="px-3 py-1">{editButton}</div>
      </div>
    );
  }

  return (
    <div
      className={`group/links flex items-center gap-3 ml-auto pl-4 flex-shrink-0 ${hasLinks ? "" : "border-l-0"}`}
      style={hasLinks ? { borderLeft: "1px solid var(--pub-divider)" } : undefined}
    >
      {links.map((link) => (
        <span
          key={link.id}
          className="flex items-center gap-1.5 py-3.5 text-sm font-medium whitespace-nowrap"
          style={{ color: accentColor, fontFamily: TAB_FONT }}
        >
          <ExternalLink className="h-3.5 w-3.5 opacity-60" />
          {link.label}
        </span>
      ))}
      {editButton}
    </div>
  );
}

/* ── Tab-limit warning chip ── */
function TabLimitWarning({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-warning-subtle border border-warning/30 flex-shrink-0">
      <AlertCircle className="h-3 w-3 text-warning shrink-0" />
      <p className="text-2xs text-warning-subtle-foreground leading-tight">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 text-warning hover:text-warning-subtle-foreground rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          aria-label="Dismiss"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export function EditableTabBar({
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onRenameTab,
  onDeleteTab,
  onReorderTabs,
  links,
  onLinksChange,
  accentColor,
  tabPlacement,
  readOnly,
  tabLimitError,
  onClearTabLimitError,
}: EditableTabBarProps) {
  // Pointer-only: keyboard sensor would hijack Enter/Space used to select tabs
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tabs.findIndex((t) => t.id === active.id);
    const newIndex = tabs.findIndex((t) => t.id === over.id);
    onReorderTabs(arrayMove(tabs.map((t) => t.id), oldIndex, newIndex));
  };

  const canDelete = tabs.length > 1;

  const addButton = !readOnly && (
    <button
      onClick={onAddTab}
      aria-label="Add tab"
      title="Add tab"
      className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground bg-background/60 border border-dashed border-border/80 backdrop-blur-sm hover:text-foreground hover:border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Plus className="h-3.5 w-3.5" />
    </button>
  );

  /* ── Left placement ── */
  if (tabPlacement === "left") {
    return (
      <nav className="flex-shrink-0 w-44 pt-0.5">
        <div className="pub-tab-bar sticky top-24 flex flex-col gap-0.5">
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
                <SortableLeftTab
                  key={tab.id}
                  tab={tab}
                  isActive={tab.id === activeTabId}
                  accentColor={accentColor}
                  readOnly={readOnly}
                  canDelete={canDelete}
                  onSelect={() => onSelectTab(tab.id)}
                  onRename={(name) => onRenameTab(tab.id, name)}
                  onDelete={() => onDeleteTab(tab.id)}
                />
              ))}
            </SortableContext>
          </DndContext>

          {!readOnly && <div className="px-3 py-1.5">{addButton}</div>}
          {tabLimitError && (
            <TabLimitWarning message={tabLimitError} onDismiss={onClearTabLimitError} />
          )}

          <EditableLinks
            links={links}
            onLinksChange={onLinksChange}
            accentColor={accentColor}
            readOnly={readOnly}
            layout="left"
          />
        </div>
      </nav>
    );
  }

  /* ── Top placement (default) ── */
  return (
    <div
      className="-mx-6 px-6 mb-10"
      style={{
        background: "var(--pub-tab-bg)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--pub-divider)",
      }}
    >
      <div className="pub-tab-bar flex items-center gap-0 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tabs.map((t) => t.id)}
            strategy={horizontalListSortingStrategy}
          >
            {tabs.map((tab) => (
              <SortableTopTab
                key={tab.id}
                tab={tab}
                isActive={tab.id === activeTabId}
                accentColor={accentColor}
                readOnly={readOnly}
                canDelete={canDelete}
                onSelect={() => onSelectTab(tab.id)}
                onRename={(name) => onRenameTab(tab.id, name)}
                onDelete={() => onDeleteTab(tab.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {!readOnly && <div className="ml-1.5 flex-shrink-0">{addButton}</div>}
        {tabLimitError && (
          <div className="ml-2">
            <TabLimitWarning message={tabLimitError} onDismiss={onClearTabLimitError} />
          </div>
        )}

        <EditableLinks
          links={links}
          onLinksChange={onLinksChange}
          accentColor={accentColor}
          readOnly={readOnly}
          layout="top"
        />
      </div>
    </div>
  );
}
