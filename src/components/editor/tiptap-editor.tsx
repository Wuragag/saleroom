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
import { EmbedNode, CTAButtonNode, LogoGridNode, FormNode, ContactCardNode, BannerNode, SyncedBlockNode } from "./extensions";
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
    // Debounce save to API
    if (styleTimerRef.current) clearTimeout(styleTimerRef.current);
    styleTimerRef.current = setTimeout(() => {
      fetch(`/api/pages/${page.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }).catch(() => toast.error("Failed to save style"));
    }, 800);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (passwordTimerRef.current) clearTimeout(passwordTimerRef.current);
    passwordTimerRef.current = setTimeout(() => {
      fetch(`/api/pages/${page.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: value }),
      }).catch(() => toast.error("Failed to save password"));
    }, 800);
  };

  const handleLinksChange = (next: PageLink[]) => {
    setLinks(next);
    if (linksTimerRef.current) clearTimeout(linksTimerRef.current);
    linksTimerRef.current = setTimeout(() => {
      fetch(`/api/pages/${page.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links: JSON.stringify(next) }),
      }).catch(() => toast.error("Failed to save links"));
    }, 800);
  };

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
          <CoverImageEditor
            pageId={page.id}
            coverImage={coverImage}
            onCoverImageChange={setCoverImage}
          />
          <EditorToolbar editor={editor} />
          <div
            className="mt-4 border border-border rounded-xl bg-card shadow-sm"
            style={getFontStyle(pageStyle.font)}
          >
            <EditorContent editor={editor} />
          </div>
          <MapPanel pageId={page.id} />
        </div>
      </div>
      <SyncedBlockPicker editor={editor} />
    </div>
  );
}
