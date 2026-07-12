"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import NextImage from "next/image";
import { EmbedNode, CTAButtonNode, LogoGridNode, FormNode, ContactCardNode, BannerNode, SyncedBlockNode, TestimonialNode, MetricsNode, SpacerNode, QuoteHeroNode, FeatureGridNode, FaqNode, PricingNode, TimelineNode, GalleryNode } from "./extensions";
import { SlashCommand } from "./extensions/slash-command";
import { EditorToolbar } from "./editor-toolbar";
import { EditorHeader } from "./editor-header";
import { EditableTitle } from "./editable-title";
import { EditableTabBar } from "./editable-tab-bar";
import { SelectionToolbar } from "./selection-toolbar";
import { BlockGutter } from "./block-gutter";
import { useTabs } from "@/hooks/use-tabs";
import { useAutoSave } from "@/hooks/use-auto-save";
import { toast } from "sonner";
import type { PageData, PageLink, TabData, MutualActionPlanData } from "@/types";
import type { ComposerOp, ComposerMapItemInput } from "@/types/ai-composer";
import { DEFAULT_CONTENT } from "@/lib/constants";
import { type PageStyle, DEFAULT_PAGE_STYLE, getAccentColor, getFontStyle, getBgHex } from "@/lib/page-styles";
import { getPubCssVars, getMaxWidth, isDarkBackground, getEditorNodeVars, getCoverHeight } from "@/lib/pub-theme";
import { PageShell, PUB_LOGO_STYLE } from "@/components/page-shell";
import { PubCover } from "@/components/pub-cover";
import { buildPageHero } from "@/components/pub-hero";
import { EditableHeroText } from "./editable-hero-text";
import { CoverImageEditor } from "./cover-image-editor";
import { MapPanel } from "./map-panel";
import { useMap } from "@/hooks/use-map";
import { SyncedBlockPicker } from "./synced-block-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock } from "lucide-react";

/** Full page snapshot the AI composer reads through the bridge. */
export interface AiComposerContext {
  title: string;
  style: PageStyle;
  activeTabId: string;
  tabs: { id: string; name: string; content: JSONContent | null }[];
  map: MutualActionPlanData | null;
}

/**
 * Bridge the AI workspace uses to read and drive the live editor — the
 * composer "operates the editor" through these primitives, so every write
 * flows through the same state/save paths a human edit would use.
 */
export interface AiEditorBridge {
  isReady: boolean;
  getContext(): AiComposerContext;
  setTitle(title: string): Promise<void>;
  setStyle(style: Partial<PageStyle>): void;
  renameTab(tabId: string, name: string): Promise<void>;
  createTab(name: string): Promise<TabData | null>;
  activateTab(tabId: string): void;
  reorderTabs(tabIds: string[]): Promise<void>;
  deleteTab(tabId: string): Promise<void>;
  /** Debounced-save page password (same path as the header Design popover). */
  setPagePassword(value: string): void;
  /** Returns false when the content can't be rendered by the editor schema. */
  setTabContent(tabId: string, content: JSONContent): Promise<boolean>;
  applyMapItems(payload: {
    title?: string;
    closeDate?: string | null;
    items?: ComposerMapItemInput[];
  }): Promise<void>;
  removeMap(): Promise<void>;
  /** Sequentially applies scoped edit ops; never throws. */
  applyOps(ops: ComposerOp[]): Promise<{ applied: number; failures: string[] }>;
}

interface TiptapEditorProps {
  page: PageData;
  readOnly?: boolean;
  lockedByName?: string;
  isCreator?: boolean;
  /** Registered by the editor so an AI chat panel can read/apply page updates. */
  aiBridgeRef?: React.MutableRefObject<AiEditorBridge | null>;
  /** While true (AI generating), text editing is disabled so an AI update
   *  can't clobber concurrent hand edits. */
  aiBusy?: boolean;
  /** Pushes live tab + style state up so an AI panel can render Structure /
   *  Design tabs that stay in sync with the canvas. */
  onEditorStateChange?: (state: EditorPanelState) => void;
  /** Hide the header's Design popover (the AI panel hosts a Design tab). */
  hideDesign?: boolean;
}

/** Snapshot the AI panel needs to render Structure + Design in sync. */
export interface EditorPanelState {
  tabs: { id: string; name: string; order: number }[];
  activeTabId: string;
  style: PageStyle;
  password: string;
  passwordProtection: boolean;
  /** Page id + cover presence so external StylePanel hosts (AI workspace)
   *  can enable Blob logo upload and the Cover controls. */
  pageId: string;
  hasCover: boolean;
}

export function TiptapEditor({ page, readOnly, lockedByName, isCreator = false, aiBridgeRef, aiBusy = false, onEditorStateChange, hideDesign = false }: TiptapEditorProps) {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const passwordProtection = (session?.user as any)?.planLimits?.passwordProtection ?? true;
  const [title, setTitle] = useState(page.title);
  const [slug, setSlug] = useState(page.slug);
  const [published, setPublished] = useState(page.published);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [isLocked, setIsLocked] = useState(!!(page as any).lockedById);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [visibility, setVisibility] = useState<"TEAM" | "PRIVATE">((page as any).visibility ?? "TEAM");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [requireEmail, setRequireEmail] = useState<boolean>(!!(page as any).requireEmail);
  const [pageStyle, setPageStyle] = useState<PageStyle>({
    font: page.font ?? DEFAULT_PAGE_STYLE.font,
    headingFont: page.headingFont ?? DEFAULT_PAGE_STYLE.headingFont,
    accentColor: page.accentColor ?? DEFAULT_PAGE_STYLE.accentColor,
    layoutWidth: page.layoutWidth ?? DEFAULT_PAGE_STYLE.layoutWidth,
    background: page.background ?? DEFAULT_PAGE_STYLE.background,
    tabPlacement: page.tabPlacement ?? DEFAULT_PAGE_STYLE.tabPlacement,
    logoUrl: page.logoUrl ?? DEFAULT_PAGE_STYLE.logoUrl,
    coverLayout: page.coverLayout ?? DEFAULT_PAGE_STYLE.coverLayout,
    coverHeight: page.coverHeight ?? DEFAULT_PAGE_STYLE.coverHeight,
    themeRadius: page.themeRadius ?? DEFAULT_PAGE_STYLE.themeRadius,
    themeDepth: page.themeDepth ?? DEFAULT_PAGE_STYLE.themeDepth,
  });
  const [coverImage, setCoverImage] = useState<string>(page.coverImage ?? "");
  const [eyebrow, setEyebrow] = useState<string>(page.eyebrow ?? "");
  const [subtitle, setSubtitle] = useState<string>(page.subtitle ?? "");
  const [links, setLinks] = useState<PageLink[]>(() => {
    try { return JSON.parse(page.links ?? "[]"); } catch { return []; }
  });
  const [password, setPassword] = useState<string>(page.password ?? "");
  const styleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const linksTimerRef = useRef<NodeJS.Timeout | null>(null);
  const passwordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const heroTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstMount = useRef(true);
  // Wrapper around EditorContent — anchors the hover block-insert handle
  const canvasRef = useRef<HTMLDivElement>(null);

  // Refs that track the latest pending payloads so the unmount flush can
  // access them without stale closures.
  const pendingStyleRef = useRef<Partial<PageStyle> | null>(null);
  const pendingLinksRef = useRef<PageLink[] | null>(null);
  const pendingPasswordRef = useRef<string | null>(null);
  const pendingHeroRef = useRef<{ eyebrow?: string; subtitle?: string } | null>(null);

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

  // Owned here (not inside MapPanel) so the AI bridge can create/update the
  // Mutual Action Plan and the panel reflects it live.
  const mapState = useMap(page.id);

  const initialContent = (() => {
    if (!activeTab) return DEFAULT_CONTENT;
    try { return JSON.parse(activeTab.content); } catch { return DEFAULT_CONTENT; }
  })();

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    // Style the live canvas with the published .pub-content rules;
    // .pub-editing disables the entrance animations while typing.
    editorProps: {
      attributes: { class: "pub-content pub-editing" },
    },
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
        },
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
      QuoteHeroNode,
      FeatureGridNode,
      FaqNode,
      PricingNode,
      TimelineNode,
      GalleryNode,
      SlashCommand,
    ],
    content: initialContent,
  });

  const handlePageSaved = useCallback((saved: { slug?: string }) => {
    if (typeof saved.slug === "string" && saved.slug) setSlug(saved.slug);
  }, []);

  const { saveStatus, forceSave, forceSaveTitle } = useAutoSave({
    pageId: page.id,
    editor,
    activeTabId,
    title,
    saveTabContent,
    onPageSaved: handlePageSaved,
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

  // Hero eyebrow/subtitle: content fields saved through the same debounced
  // PUT the style/password fields use.
  const handleHeroTextChange = (field: "eyebrow" | "subtitle", value: string) => {
    if (field === "eyebrow") setEyebrow(value);
    else setSubtitle(value);
    pendingHeroRef.current = { ...pendingHeroRef.current, [field]: value };
    if (heroTimerRef.current) clearTimeout(heroTimerRef.current);
    heroTimerRef.current = setTimeout(() => {
      const payload = pendingHeroRef.current;
      pendingHeroRef.current = null;
      fetch(`/api/pages/${page.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => toast.error("Failed to save"));
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
      if (heroTimerRef.current) clearTimeout(heroTimerRef.current);

      // Build a single merged payload from all pending saves
      const payload: Record<string, unknown> = {};
      if (pendingStyleRef.current) Object.assign(payload, pendingStyleRef.current);
      if (pendingHeroRef.current) Object.assign(payload, pendingHeroRef.current);
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

  // Register the AI bridge every render (no dep array) so its closures always
  // see fresh state. Style/title flow through the existing debounced saves;
  // content persists immediately via the same path a tab switch uses.
  // Lock text editing while the AI is generating so its update can't clobber
  // concurrent hand edits. `setContent` in applyUpdate uses emitUpdate:false,
  // so it still writes even while non-editable.
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly && !aiBusy);
  }, [editor, readOnly, aiBusy]);

  useEffect(() => {
    if (!aiBridgeRef) return;

    const setTabContent = async (
      tabId: string,
      content: JSONContent
    ): Promise<boolean> => {
      if (tabId === activeTabId && editor) {
        try {
          editor.commands.setContent(content, {
            emitUpdate: false,
            errorOnInvalidContent: true,
          });
        } catch {
          return false;
        }
        const json = JSON.stringify(editor.getJSON());
        updateTabContentLocally(tabId, json);
        await saveTabContent(tabId, json);
        return true;
      }
      // Non-active tab: write straight to state + server; the tab-switch
      // effect loads from state, so activation shows the new content.
      try {
        const json = JSON.stringify(content);
        updateTabContentLocally(tabId, json);
        await saveTabContent(tabId, json);
        return true;
      } catch {
        return false;
      }
    };

    const applyMapItems = async (payload: {
      title?: string;
      closeDate?: string | null;
      items?: ComposerMapItemInput[];
    }) => {
      if (!mapState.map) await mapState.enableMap();
      if (payload.title !== undefined || payload.closeDate !== undefined) {
        await mapState.updateMap({
          ...(payload.title !== undefined ? { title: payload.title } : {}),
          ...(payload.closeDate !== undefined ? { closeDate: payload.closeDate } : {}),
        });
      }
      if (!payload.items) return;

      // Diff by normalized title so `completed` survives item-list replaces.
      const norm = (s: string) => s.trim().toLowerCase();
      const existing = mapState.map?.items ?? [];
      const incoming = payload.items.filter((i) => i.title.trim());
      const matchedIds = new Set<string>();

      for (const item of incoming) {
        const match = existing.find(
          (e) => !matchedIds.has(e.id) && norm(e.title) === norm(item.title)
        );
        if (match) {
          matchedIds.add(match.id);
          await mapState.updateItem(match.id, {
            ownerType: item.ownerType,
            ownerName: item.ownerName ?? match.ownerName,
            dueDate: item.dueDate ?? match.dueDate,
          });
        } else {
          await mapState.addItem({
            title: item.title,
            ownerType: item.ownerType,
            ownerName: item.ownerName ?? "",
            dueDate: item.dueDate ?? null,
          });
        }
      }
      for (const e of existing) {
        if (!matchedIds.has(e.id)) await mapState.deleteItem(e.id);
      }
    };

    aiBridgeRef.current = {
      isReady: !!editor,
      getContext: () => ({
        title,
        style: pageStyle,
        activeTabId,
        tabs: tabs.map((t) => {
          if (t.id === activeTabId) {
            return { id: t.id, name: t.name, content: editor?.getJSON() ?? null };
          }
          try {
            return { id: t.id, name: t.name, content: JSON.parse(t.content) };
          } catch {
            return { id: t.id, name: t.name, content: null };
          }
        }),
        map: mapState.map,
      }),
      setTitle: async (value: string) => {
        setTitle(value);
        await forceSaveTitle(value);
      },
      setStyle: (style: Partial<PageStyle>) => {
        if (Object.keys(style).length > 0) handleStyleChange(style);
      },
      renameTab: (tabId: string, name: string) => renameTab(tabId, name),
      createTab: (name: string) => addTab(name),
      activateTab: (tabId: string) => handleSelectTab(tabId),
      reorderTabs: (tabIds: string[]) => reorderTabs(tabIds),
      deleteTab: (tabId: string) => deleteTab(tabId),
      setPagePassword: (value: string) => handlePasswordChange(value),
      setTabContent,
      applyMapItems,
      removeMap: () => mapState.disableMap(),
      applyOps: async (ops: ComposerOp[]) => {
        let applied = 0;
        const failures: string[] = [];
        for (const op of ops) {
          try {
            switch (op.op) {
              case "setTitle":
                setTitle(op.title);
                await forceSaveTitle(op.title);
                applied++;
                break;
              case "setStyle":
                handleStyleChange(op.style);
                applied++;
                break;
              case "renameTab":
                await renameTab(op.tabId, op.name);
                applied++;
                break;
              case "updateTab": {
                const ok = await setTabContent(op.tabId, op.content);
                if (ok) applied++;
                else {
                  const name = tabs.find((t) => t.id === op.tabId)?.name ?? op.tabId;
                  failures.push(`Couldn't update the "${name}" tab`);
                }
                break;
              }
              case "addTab": {
                const tab = await addTab(op.name);
                if (!tab) {
                  failures.push(`Couldn't add the "${op.name}" tab (plan limit?)`);
                  break;
                }
                const ok = await setTabContent(tab.id, op.content);
                if (ok) applied++;
                else failures.push(`Couldn't fill the "${op.name}" tab`);
                break;
              }
              case "setMap":
                await applyMapItems({
                  title: op.title,
                  closeDate: op.closeDate,
                  items: op.items,
                });
                applied++;
                break;
              case "removeMap":
                await mapState.disableMap();
                applied++;
                break;
            }
          } catch {
            failures.push(`A change failed to apply (${op.op})`);
          }
        }
        return { applied, failures };
      },
    };
    return () => {
      aiBridgeRef.current = null;
    };
  });

  // Keep the AI panel's Structure/Design tabs in sync with the live canvas.
  // `tabs` changes identity on every content autosave, so compare the pushed
  // slice and skip no-op pushes — otherwise the whole AI workspace (chat
  // included) re-renders every few seconds while the user types.
  const lastPanelStateRef = useRef<string>("");
  useEffect(() => {
    const snapshot: EditorPanelState = {
      tabs: tabs.map((t) => ({ id: t.id, name: t.name, order: t.order })),
      activeTabId,
      style: pageStyle,
      password,
      passwordProtection,
      pageId: page.id,
      hasCover: Boolean(coverImage),
    };
    const key = JSON.stringify(snapshot);
    if (key === lastPanelStateRef.current) return;
    lastPanelStateRef.current = key;
    onEditorStateChange?.(snapshot);
  }, [tabs, activeTabId, pageStyle, password, passwordProtection, page.id, coverImage, onEditorStateChange]);

  // ── WYSIWYG canvas: derive the published-page shell from the live style ──
  const accent = getAccentColor(pageStyle.accentColor);
  const bgHex = getBgHex(pageStyle.background);
  const isDark = isDarkBackground(pageStyle.background);
  const maxWidth = getMaxWidth(pageStyle.layoutWidth);
  const fontStyle = getFontStyle(pageStyle.font);
  const pubCssVars = getPubCssVars({
    accentColor: accent,
    background: pageStyle.background,
    font: pageStyle.font,
    headingFont: pageStyle.headingFont,
    themeRadius: pageStyle.themeRadius,
    themeDepth: pageStyle.themeDepth,
  });
  const coverHeightPx = getCoverHeight(pageStyle.coverHeight, pageStyle.coverLayout);
  // Overlay hero parity is exact in read-only mode; while editing, the hero
  // fields stay in the column so they remain directly editable.
  const overlayHero = Boolean(coverImage) && pageStyle.coverLayout === "overlay" && !!readOnly;

  const editorCanvas = editor ? (
    <div ref={canvasRef} className="relative">
      <EditorContent editor={editor} />
      {!readOnly && (
        <>
          <SelectionToolbar editor={editor} />
          <BlockGutter editor={editor} containerRef={canvasRef} />
        </>
      )}
    </div>
  ) : (
    <div className="space-y-3" aria-hidden="true">
      <Skeleton className="h-6 w-2/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  );

  const tabBar = (
    <EditableTabBar
      tabs={tabs}
      activeTabId={activeTabId}
      onSelectTab={handleSelectTab}
      onAddTab={() => {
        // addTab takes an optional name — don't let the click event leak in
        addTab();
      }}
      onRenameTab={renameTab}
      onDeleteTab={deleteTab}
      onReorderTabs={reorderTabs}
      links={links}
      onLinksChange={handleLinksChange}
      accentColor={accent}
      tabPlacement={pageStyle.tabPlacement as "top" | "left"}
      readOnly={readOnly}
      tabLimitError={tabLimitError}
      onClearTabLimitError={clearTabLimitError}
    />
  );

  // App-themed chrome pinned above the page: header + floating toolbar
  const editingChrome = (
    <div className="sticky top-0 z-50">
      <EditorHeader
        title={title}
        slug={slug}
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
        pageStyle={pageStyle}
        onStyleChange={handleStyleChange}
        hasCover={Boolean(coverImage)}
        hideDesign={hideDesign}
        password={password}
        onPasswordChange={handlePasswordChange}
        passwordProtection={passwordProtection}
      />

      {readOnly ? (
        <div className="mt-3 flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-background/95 backdrop-blur px-4 py-2 text-sm text-muted-foreground shadow-lg">
            <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              {lockedByName
                ? `This page is locked by ${lockedByName}. You're viewing in read-only mode.`
                : "You're viewing this page in read-only mode."}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto max-w-full">
            {editor ? (
              <EditorToolbar
                editor={editor}
                className="static bg-background/95 backdrop-blur shadow-lg"
              />
            ) : (
              <div
                className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-background/95 backdrop-blur shadow-lg p-1.5"
                aria-hidden="true"
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-8 rounded-md" />
                ))}
                <Skeleton className="h-8 w-28 rounded-lg" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <PageShell
        bgHex={bgHex}
        fontStyle={fontStyle}
        cssVars={pubCssVars}
        accentColor={accent}
        isDark={isDark}
        maxWidth={maxWidth}
        style={
          {
            "--page-accent": accent,
            // Editor-only tokens derived from the same ramp as the published
            // renderer (node views can't receive isDark as a prop)
            ...getEditorNodeVars(accent, pageStyle.background),
          } as React.CSSProperties
        }
        banner={editingChrome}
        coverImage={
          readOnly ? (
            coverImage ? (
              <PubCover
                src={coverImage}
                coverHeight={pageStyle.coverHeight}
                coverLayout={pageStyle.coverLayout}
                maxWidth={maxWidth}
                overlayContent={
                  overlayHero
                    ? (() => {
                        const hero = buildPageHero({
                          title,
                          eyebrow,
                          subtitle,
                          logoUrl: pageStyle.logoUrl,
                          overlay: true,
                        });
                        return (
                          <>
                            {hero.logo}
                            {hero.eyebrow}
                            {hero.title}
                            {hero.subtitle}
                          </>
                        );
                      })()
                    : undefined
                }
              />
            ) : undefined
          ) : (
            <CoverImageEditor
              pageId={page.id}
              coverImage={coverImage}
              onCoverImageChange={setCoverImage}
              maxWidth={maxWidth}
              height={coverHeightPx}
            />
          )
        }
        // Published pages use 72px without a cover (56px in overlay mode);
        // when editable, the "Add cover" ghost strip adds ~32px of chrome.
        paddingTop={coverImage ? (overlayHero ? "56px" : "40px") : readOnly ? "72px" : "40px"}
        logo={
          !overlayHero && pageStyle.logoUrl ? (
            <NextImage
              src={pageStyle.logoUrl}
              alt="Logo"
              width={180}
              height={36}
              style={PUB_LOGO_STYLE}
            />
          ) : undefined
        }
        eyebrow={
          overlayHero ? undefined : (
            <EditableHeroText
              value={eyebrow}
              onChange={(v) => handleHeroTextChange("eyebrow", v)}
              readOnly={readOnly}
              variant="eyebrow"
              placeholder="Add an eyebrow label"
            />
          )
        }
        title={
          overlayHero ? undefined : (
            <EditableTitle value={title} onChange={setTitle} readOnly={readOnly} />
          )
        }
        subtitle={
          overlayHero ? undefined : (
            <EditableHeroText
              value={subtitle}
              onChange={(v) => handleHeroTextChange("subtitle", v)}
              readOnly={readOnly}
              variant="subtitle"
              placeholder="Add a subtitle"
            />
          )
        }
        trailing={<SyncedBlockPicker editor={editor} />}
      >
        {pageStyle.tabPlacement === "left" ? (
          <div className="flex gap-10">
            {tabBar}
            <div className="flex-1 min-w-0">
              {editorCanvas}
              <MapPanel mapState={mapState} />
            </div>
          </div>
        ) : (
          <>
            {tabBar}
            {editorCanvas}
            <MapPanel mapState={mapState} />
          </>
        )}
      </PageShell>
    </>
  );
}
