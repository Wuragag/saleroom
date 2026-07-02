"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { EmbedNode, CTAButtonNode, LogoGridNode, FormNode, ContactCardNode, BannerNode, SyncedBlockNode, TestimonialNode, MetricsNode, SpacerNode } from "./extensions";
import { SlashCommand } from "./extensions/slash-command";
import { EditorToolbar } from "./editor-toolbar";
import { EditorHeader } from "./editor-header";
import { TabSidebar } from "./tab-sidebar";
import { useTabs } from "@/hooks/use-tabs";
import { useAutoSave } from "@/hooks/use-auto-save";
import { toast } from "sonner";
import type { PageData, PageLink } from "@/types";
import { DEFAULT_CONTENT } from "@/lib/constants";
import { type PageStyle, DEFAULT_PAGE_STYLE, getAccentColor, getFontStyle } from "@/lib/page-styles";
import { CoverImageEditor } from "./cover-image-editor";
import { MapPanel } from "./map-panel";
import { SyncedBlockPicker } from "./synced-block-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Lock, PanelLeft } from "lucide-react";

interface TiptapEditorProps {
  page: PageData;
  readOnly?: boolean;
  lockedByName?: string;
  isCreator?: boolean;
}

export function TiptapEditor({ page, readOnly, lockedByName, isCreator = false }: TiptapEditorProps) {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const passwordProtection = (session?.user as any)?.planLimits?.passwordProtection ?? true;
  const [title, setTitle] = useState(page.title);
  const [published, setPublished] = useState(page.published);
  // Mobile off-canvas sidebar (tabs + style) drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [isLocked, setIsLocked] = useState(!!(page as any).lockedById);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [visibility, setVisibility] = useState<"TEAM" | "PRIVATE">((page as any).visibility ?? "TEAM");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [requireEmail, setRequireEmail] = useState<boolean>(!!(page as any).requireEmail);
  const [pageStyle, setPageStyle] = useState<PageStyle>({
    font: page.font ?? DEFAULT_PAGE_STYLE.font,
    accentColor: page.accentColor ?? DEFAULT_PAGE_STYLE.accentColor,
    layoutWidth: page.layoutWidth ?? DEFAULT_PAGE_STYLE.layoutWidth,
    background: page.background ?? DEFAULT_PAGE_STYLE.background,
    tabPlacement: page.tabPlacement ?? DEFAULT_PAGE_STYLE.tabPlacement,
    logoUrl: page.logoUrl ?? DEFAULT_PAGE_STYLE.logoUrl,
  });
  const [coverImage, setCoverImage] = useState<string>(page.coverImage ?? "");
  const [links, setLinks] = useState<PageLink[]>(() => {
    try { return JSON.parse(page.links ?? "[]"); } catch { return []; }
  });
  const [password, setPassword] = useState<string>(page.password ?? "");
  const styleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const linksTimerRef = useRef<NodeJS.Timeout | null>(null);
  const passwordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstMount = useRef(true);

  // Refs that track the latest pending payloads so the unmount flush can
  // access them without stale closures.
  const pendingStyleRef = useRef<Partial<PageStyle> | null>(null);
  const pendingLinksRef = useRef<PageLink[] | null>(null);
  const pendingPasswordRef = useRef<string | null>(null);

  const {
    tabs,
    activeTab,
    activeTabId,
    setActiveTabId,
    addTab,
    renameTab,
    deleteTab,
    reorderTabs,
    saveTabContent,
    updateTabContentLocally,
    tabLimitError,
    clearTabLimitError,
  } = useTabs(page.id, page.tabs);

  const initialContent = (() => {
    if (!activeTab) return DEFAULT_CONTENT;
    try { return JSON.parse(activeTab.content); } catch { return DEFAULT_CONTENT; }
  })();

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands...",
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      TextStyle,
      Color,
      EmbedNode,
      CTAButtonNode,
      LogoGridNode,
      FormNode,
      ContactCardNode,
      BannerNode,
      SyncedBlockNode,
      TestimonialNode,
      MetricsNode,
      SpacerNode,
      SlashCommand,
    ],
    content: initialContent,
  });

  const { saveStatus, forceSave } = useAutoSave({
    pageId: page.id,
    editor,
    activeTabId,
    title,
    saveTabContent,
  });

  // Track the tab ID the editor was initialised with so we can detect
  // whether a setContent call is needed when the editor first becomes ready.
  const initialTabIdRef = useRef(activeTabId);

  // Update editor content when active tab changes (or when editor becomes ready)
  useEffect(() => {
    if (!editor || !activeTab) return;

    // On the very first run after the editor is ready, skip setContent ONLY
    // if the active tab is still the one useEditor was initialised with.
    // If the user switched tabs before the editor was created, we must load
    // the correct tab now.
    if (isFirstMount.current) {
      isFirstMount.current = false;
      if (activeTabId === initialTabIdRef.current) return;
    }

    try {
      const content = JSON.parse(activeTab.content);
      editor.commands.setContent(content, { emitUpdate: false });
    } catch {
      editor.commands.setContent(DEFAULT_CONTENT, { emitUpdate: false });
    }
  }, [activeTabId, editor, activeTab]); // re-run when editor becomes ready or tab changes

  const handleSelectTab = (tabId: string) => {
    if (tabId === activeTabId) return;
    if (editor) {
      const content = JSON.stringify(editor.getJSON());
      // Save content locally (so the tabs state is up-to-date)
      updateTabContentLocally(activeTabId, content);
      // Also persist to the server so edits aren't lost if the user
      // navigates away before the next auto-save fires.
      saveTabContent(activeTabId, content).catch(() => {});
    }
    // Clear any stale tab-limit warning when switching tabs
    clearTabLimitError();
    setActiveTabId(tabId);
  };

  const handleStyleChange = (patch: Partial<PageStyle>) => {
    const next = { ...pageStyle, ...patch };
    setPageStyle(next);
    // Merge into pending payload so rapid changes are batched
    pendingStyleRef.current = { ...pendingStyleRef.current, ...patch };
    if (styleTimerRef.current) clearTimeout(styleTimerRef.current);
    styleTimerRef.current = setTimeout(() => {
      const payload = pendingStyleRef.current;
      pendingStyleRef.current = null;
      fetch(`/api/pages/${page.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => toast.error("Failed to save style"));
    }, 800);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    pendingPasswordRef.current = value;
    if (passwordTimerRef.current) clearTimeout(passwordTimerRef.current);
    passwordTimerRef.current = setTimeout(() => {
      const val = pendingPasswordRef.current;
      pendingPasswordRef.current = null;
      fetch(`/api/pages/${page.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: val }),
      }).catch(() => toast.error("Failed to save password"));
    }, 800);
  };

  const handleLinksChange = (next: PageLink[]) => {
    setLinks(next);
    pendingLinksRef.current = next;
    if (linksTimerRef.current) clearTimeout(linksTimerRef.current);
    linksTimerRef.current = setTimeout(() => {
      const val = pendingLinksRef.current;
      pendingLinksRef.current = null;
      fetch(`/api/pages/${page.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links: JSON.stringify(val) }),
      }).catch(() => toast.error("Failed to save links"));
    }, 800);
  };

  // Flush any pending debounced saves on unmount so data isn't lost on navigation
  useEffect(() => {
    return () => {
      if (styleTimerRef.current) clearTimeout(styleTimerRef.current);
      if (passwordTimerRef.current) clearTimeout(passwordTimerRef.current);
      if (linksTimerRef.current) clearTimeout(linksTimerRef.current);

      // Build a single merged payload from all pending saves
      const payload: Record<string, unknown> = {};
      if (pendingStyleRef.current) Object.assign(payload, pendingStyleRef.current);
      if (pendingPasswordRef.current !== null) payload.password = pendingPasswordRef.current;
      if (pendingLinksRef.current !== null) payload.links = JSON.stringify(pendingLinksRef.current);

      if (Object.keys(payload).length > 0) {
        // Use keepalive so the request survives page unload
        fetch(`/api/pages/${page.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="min-h-screen bg-background flex"
      style={{ "--page-accent": getAccentColor(pageStyle.accentColor) } as React.CSSProperties}
    >
      <TabSidebar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={handleSelectTab}
        onAddTab={addTab}
        onRenameTab={renameTab}
        onDeleteTab={deleteTab}
        onReorderTabs={reorderTabs}
        pageStyle={pageStyle}
        onStyleChange={handleStyleChange}
        links={links}
        onLinksChange={handleLinksChange}
        password={password}
        onPasswordChange={handlePasswordChange}
        tabLimitError={tabLimitError}
        onClearTabLimitError={clearTabLimitError}
        passwordProtection={passwordProtection}
        mobileOpen={drawerOpen}
        onMobileClose={() => setDrawerOpen(false)}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <EditorHeader
          title={title}
          onTitleChange={setTitle}
          slug={page.slug}
          pageId={page.id}
          published={published}
          onPublishedChange={setPublished}
          saveStatus={saveStatus}
          onForceSave={forceSave}
          readOnly={readOnly}
          lockedByName={lockedByName}
          isLocked={isLocked}
          onLockChange={setIsLocked}
          visibility={visibility}
          onVisibilityChange={setVisibility}
          isCreator={isCreator}
          requireEmail={requireEmail}
          onRequireEmailChange={setRequireEmail}
        />
        <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-4">
          {/* Mobile: open the tabs & style drawer (sidebar is off-canvas under md) */}
          <div className="md:hidden mb-3">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg gap-1.5"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open tabs & style"
              aria-expanded={drawerOpen}
            >
              <PanelLeft className="h-4 w-4" />
              Tabs &amp; Style
            </Button>
          </div>

          {!readOnly && (
            <CoverImageEditor
              pageId={page.id}
              coverImage={coverImage}
              onCoverImageChange={setCoverImage}
            />
          )}

          {readOnly ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>
                {lockedByName
                  ? `This page is locked by ${lockedByName}. You're viewing in read-only mode.`
                  : "You're viewing this page in read-only mode."}
              </span>
            </div>
          ) : !editor ? (
            // Lightweight loading skeleton: toolbar placeholder + canvas shimmer
            <div
              className="sticky top-0 z-10 flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-background p-1.5"
              aria-hidden="true"
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-8 rounded-md" />
              ))}
              <div className="flex-1" />
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
          ) : (
            <EditorToolbar editor={editor} />
          )}

          <div
            className="mt-4 border border-border rounded-xl bg-card shadow-sm"
            style={getFontStyle(pageStyle.font)}
          >
            {editor ? (
              <EditorContent editor={editor} />
            ) : (
              <div className="space-y-3 p-6" aria-hidden="true">
                <Skeleton className="h-6 w-2/5" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            )}
          </div>
          <MapPanel pageId={page.id} />
        </div>
      </div>
      <SyncedBlockPicker editor={editor} />
    </div>
  );
}
