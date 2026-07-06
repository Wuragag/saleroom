"use client";

import { useState, useRef, useCallback } from "react";
import { Sparkles, MessageSquare, FileText, Layers, Palette } from "lucide-react";
import type { JSONContent } from "@tiptap/core";
import {
  TiptapEditor,
  type AiEditorBridge,
  type EditorPanelState,
} from "@/components/editor/tiptap-editor";
import {
  AiChatPanel,
  type ChatMessage,
  type ProgressStep,
} from "./ai-chat-panel";
import { StructurePanel } from "./structure-panel";
import { StylePanel } from "@/components/editor/style-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { PageData } from "@/types";
import type {
  ComposerPlan,
  ComposerOp,
  PlanResponse,
  BuildTabResponse,
  EditResponse,
  ComposerChatMessage,
} from "@/types/ai-composer";

let messageCounter = 0;
function nextMessageId() {
  return `msg_${++messageCounter}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Omit that distributes over unions (plain Omit collapses ChatMessage). */
type DistributiveOmit<T, K extends keyof never> = T extends unknown
  ? Omit<T, K>
  : never;

/** Wait until the editor bridge reports ready (editor mounts on same render). */
async function waitForBridge(
  ref: React.MutableRefObject<AiEditorBridge | null>,
  timeoutMs = 5000
): Promise<AiEditorBridge | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (ref.current?.isReady) return ref.current;
    await new Promise((r) => setTimeout(r, 100));
  }
  return ref.current;
}

const docIsEmpty = (c: JSONContent | null) =>
  !c?.content?.length ||
  c.content.every((n) => n.type === "paragraph" && !n.content?.length);

/** Placeholder for the Structure/Design tabs before a page exists. */
function PanelHint({ label }: { label: string }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center px-8 text-center">
      <p className="text-small text-muted-foreground">{label}</p>
    </div>
  );
}

/** Does any built doc contain a ctaButton node? */
function hasCta(docs: (JSONContent | null)[]): boolean {
  const walk = (n: JSONContent | undefined): boolean =>
    !!n &&
    (n.type === "ctaButton" || (n.content ?? []).some((c) => walk(c)));
  return docs.some((d) => walk(d ?? undefined));
}

/** Thrown by postComposer — preserves the server's error code (e.g.
 *  "INSUFFICIENT_CREDITS") so callers can branch instead of showing a
 *  generic failure message. */
class ComposerError extends Error {
  code?: string;
  required?: number;
  available?: number;
  constructor(
    message: string,
    opts?: { code?: string; required?: number; available?: number }
  ) {
    super(message);
    this.name = "ComposerError";
    this.code = opts?.code;
    this.required = opts?.required;
    this.available = opts?.available;
  }
}

/** POST a composer phase; throws ComposerError on any failure. */
async function postComposer<T>(pageId: string, body: unknown): Promise<T> {
  const res = await fetch(`/api/ai-chat/${pageId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    throw new ComposerError(
      data?.error ?? "The AI request failed. Please try again.",
      { code: data?.code, required: data?.required, available: data?.available }
    );
  }
  return data as T;
}

type FlowState = "idle" | "planning" | "building" | "editing";

/** Shimmering page silhouette shown while the plan is being thought through. */
function PageBuildingSkeleton() {
  return (
    <div className="absolute inset-0 z-10 overflow-hidden bg-background">
      <div className="mx-auto max-w-[720px] px-6 pt-20 pb-16">
        <div className="mb-10 flex items-center gap-2.5 rounded-full border border-border/70 bg-card/70 px-4 py-2 w-fit shadow-elevation-1 backdrop-blur">
          <span className="gradient-ai flex h-5 w-5 items-center justify-center rounded-full text-white">
            <Sparkles className="h-3 w-3" />
          </span>
          <span className="animate-pulse text-xs font-medium text-muted-foreground">
            Thinking through the buyer journey…
          </span>
        </div>
        <Skeleton className="mb-3 h-11 w-[85%] rounded-xl" />
        <Skeleton className="mb-10 h-11 w-[55%] rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-[92%] rounded-md" />
          <Skeleton className="h-4 w-[78%] rounded-md" />
        </div>
        <div className="mt-9 grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="mt-9 space-y-3">
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-[88%] rounded-md" />
        </div>
        <Skeleton className="mt-9 h-11 w-40 rounded-lg" />
      </div>
    </div>
  );
}

interface AiWorkspaceProps {
  initialPage: PageData | null;
}

/**
 * "Create with AI" sales-page composer: chat on the left, the live WYSIWYG
 * editor on the right. Create requests run plan → per-tab build (visible,
 * step by step) → summary; follow-ups run scoped edit ops. Chat history is
 * session-only by design; the page persists through the editor's save paths.
 */
export function AiWorkspace({ initialPage }: AiWorkspaceProps) {
  // Set exactly once (here or on first message) — TiptapEditor seeds its
  // state from this prop on mount, so its identity must never change after.
  const [page, setPage] = useState<PageData | null>(initialPage);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [flow, setFlow] = useState<FlowState>("idle");
  const [limitError, setLimitError] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"chat" | "page">("chat");
  const [hasBuilt, setHasBuilt] = useState(!!initialPage);
  const [panelTab, setPanelTab] = useState<"chat" | "structure" | "design">("chat");
  const [editorState, setEditorState] = useState<EditorPanelState | null>(null);
  const bridgeRef = useRef<AiEditorBridge | null>(null);
  const pageRef = useRef<PageData | null>(initialPage);

  const generating = flow !== "idle";
  const generatingLabel =
    flow === "planning"
      ? "Thinking through the buyer journey…"
      : flow === "building"
      ? "Building your page…"
      : "Making changes…";

  const appendMessage = useCallback((msg: DistributiveOmit<ChatMessage, "id">) => {
    const id = nextMessageId();
    setMessages((prev) => [...prev, { ...msg, id } as ChatMessage]);
    return id;
  }, []);

  const patchStep = useCallback(
    (messageId: string, stepId: string, patch: Partial<ProgressStep>) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId && m.kind === "progress"
            ? {
                ...m,
                steps: m.steps.map((s) =>
                  s.id === stepId ? { ...s, ...patch } : s
                ),
              }
            : m
        )
      );
    },
    []
  );

  const toApiHistory = (history: ChatMessage[]): ComposerChatMessage[] =>
    history
      .filter((m): m is Extract<ChatMessage, { kind?: "text" }> => m.kind !== "progress")
      .map((m) => ({ role: m.role, content: m.content }));

  // ── Create flow: plan → build tabs one by one → MAP → summary ────────────

  const runCreateFlow = useCallback(
    async (history: ChatMessage[], userText: string) => {
      setFlow("planning");
      let createdPageId: string | null = null;

      const cleanupCreatedPage = async () => {
        if (!createdPageId) return;
        try {
          await fetch(`/api/pages/${createdPageId}`, { method: "DELETE" });
        } catch {
          // Best effort: the important part is that existing pages are never deleted.
        }
        if (pageRef.current?.id === createdPageId) {
          pageRef.current = null;
          setPage(null);
          setHasBuilt(false);
          window.history.replaceState(null, "", "/ai");
        }
      };

      // Ensure the page exists so the editor mounts beside the chat
      let currentPage = pageRef.current;
      if (!currentPage) {
        const res = await fetch("/api/pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Untitled Page" }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (data.code === "PLAN_LIMIT") {
            setLimitError(data.error ?? "You've reached your plan's page limit.");
          } else {
            appendMessage({
              role: "assistant",
              content: data.error ?? "Couldn't create a page. Please try again.",
              isError: true,
            });
          }
          return;
        }
        currentPage = data as PageData;
        createdPageId = currentPage.id;
        pageRef.current = currentPage;
        setPage(currentPage);
        // Shallow URL update — router.replace would remount and wipe chat state
        window.history.replaceState(null, "", `/ai/${currentPage.id}`);
      }
      const pageId = currentPage.id;

      const bridge = await waitForBridge(bridgeRef);
      if (!bridge?.isReady) {
        await cleanupCreatedPage();
        appendMessage({
          role: "assistant",
          content: "The editor didn't finish loading, so I didn't start the AI build. Please try again.",
          isError: true,
        });
        return;
      }
      const baseContext = bridge.getContext();

      // 1. Plan
      let planRes: PlanResponse;
      try {
        planRes = await postComposer<PlanResponse>(pageId, {
          phase: "plan",
          messages: toApiHistory(history),
          context: {
            title: baseContext?.title ?? currentPage.title,
            style: baseContext?.style ?? {},
          },
        });
      } catch (err) {
        if (err instanceof ComposerError && err.code === "INSUFFICIENT_CREDITS") {
          setLimitError(err.message);
          await cleanupCreatedPage();
          return;
        }
        await cleanupCreatedPage();
        appendMessage({
          role: "assistant",
          content: err instanceof Error ? err.message : "Planning failed.",
          isError: true,
        });
        return;
      }
      const plan: ComposerPlan = planRes.plan;

      // Reserve the full estimated build cost upfront — if the team can't
      // afford ALL tabs, don't start building any of them.
      if (!planRes.credits.sufficientForBuild) {
        appendMessage({ role: "assistant", content: planRes.reply });
        appendMessage({
          role: "assistant",
          content: `This page needs about ${planRes.credits.requiredForBuild} more AI credits to build (${plan.tabs.length} tab${plan.tabs.length === 1 ? "" : "s"}) — you have ${planRes.credits.remaining} left this month.`,
          isError: true,
        });
        setLimitError(
          "You've run out of AI credits to build this page. Upgrade for more credits."
        );
        await cleanupCreatedPage();
        return;
      }

      // 2. Show the plan + the live progress checklist
      appendMessage({ role: "assistant", content: planRes.reply });
      const steps: ProgressStep[] = [
        { id: "journey", label: "Thinking through the buyer journey", status: "done" },
        { id: "structure", label: "Setting up the page structure", status: "pending" },
        ...plan.tabs.map((t, i) => ({
          id: `tab:${i}`,
          label: `Writing "${t.name}"`,
          status: "pending" as const,
        })),
        ...(plan.includeMap
          ? [{ id: "map", label: "Creating the Mutual Action Plan", status: "pending" as const }]
          : []),
        { id: "finalize", label: "Reviewing and finalizing", status: "pending" },
      ];
      const progressId = appendMessage({
        role: "assistant",
        kind: "progress",
        steps,
      });

      setFlow("building");

      // 3. Structure: title, style, rename the existing first tab
      patchStep(progressId, "structure", { status: "active" });
      const liveBridge = bridgeRef.current;
      if (!liveBridge?.isReady) {
        await cleanupCreatedPage();
        appendMessage({
          role: "assistant",
          content: "The editor disconnected before I could build the page. Please try again.",
          isError: true,
        });
        return;
      }
      try {
        await liveBridge.setTitle(plan.title);
      } catch {
        // Keep building; content persistence will still surface any auth/save failures.
      }
      if (plan.style && Object.keys(plan.style).length > 0) {
        liveBridge.setStyle(plan.style);
      }
      const ctx = liveBridge.getContext();
      const firstTabId = ctx.tabs[0]?.id;
      if (firstTabId && plan.tabs[0]) {
        await liveBridge.renameTab(firstTabId, plan.tabs[0].name);
      }
      patchStep(progressId, "structure", { status: "done" });

      // 4. Build each tab sequentially — the user watches tabs fill in
      const builtTabs: { name: string; summary: string }[] = [];
      const builtDocs: (JSONContent | null)[] = [];
      const failures: string[] = [];

      for (let i = 0; i < plan.tabs.length; i++) {
        const spec = plan.tabs[i];
        const stepId = `tab:${i}`;
        patchStep(progressId, stepId, { status: "active" });

        const b = bridgeRef.current;
        if (!b) break;

        // First plan tab reuses the page's existing tab
        let tabId: string | null = i === 0 ? firstTabId ?? null : null;
        if (!tabId) {
          const tab = await b.createTab(spec.name);
          tabId = tab?.id ?? null;
        }
        if (!tabId) {
          patchStep(progressId, stepId, {
            status: "error",
            note: "Couldn't create this tab (plan limit?)",
          });
          failures.push(spec.name);
          continue;
        }

        b.activateTab(tabId);

        // Build with one retry — except for credit exhaustion, which won't
        // succeed on a retry and should stop the rest of the build, not just
        // this tab.
        let built: BuildTabResponse | null = null;
        let creditsExhausted = false;
        for (let attempt = 0; attempt < 2 && !built; attempt++) {
          try {
            built = await postComposer<BuildTabResponse>(pageId, {
              phase: "build-tab",
              userRequest: userText,
              plan,
              tabId,
              tabSpec: spec,
              builtTabs,
              context: { style: bridgeRef.current?.getContext().style ?? {} },
            });
          } catch (err) {
            if (err instanceof ComposerError && err.code === "INSUFFICIENT_CREDITS") {
              creditsExhausted = true;
              break;
            }
            if (attempt === 0) await new Promise((r) => setTimeout(r, 2000));
          }
        }

        if (creditsExhausted) {
          patchStep(progressId, stepId, {
            status: "error",
            note: "Ran out of AI credits",
          });
          failures.push(spec.name);
          for (let j = i + 1; j < plan.tabs.length; j++) {
            patchStep(progressId, `tab:${j}`, {
              status: "error",
              note: "Skipped — out of AI credits",
            });
            failures.push(plan.tabs[j].name);
          }
          setLimitError(
            "You've run out of AI credits to keep building. Upgrade for more credits."
          );
          break;
        }

        if (!built) {
          patchStep(progressId, stepId, {
            status: "error",
            note: "Couldn't write this tab — ask me to retry it",
          });
          failures.push(spec.name);
          continue;
        }

        const ok = await (bridgeRef.current?.setTabContent(tabId, built.content) ??
          Promise.resolve(false));
        if (!ok) {
          patchStep(progressId, stepId, {
            status: "error",
            note: "The content couldn't be rendered",
          });
          failures.push(spec.name);
          continue;
        }

        builtTabs.push({ name: spec.name, summary: built.summary || spec.purpose });
        builtDocs.push(built.content);
        patchStep(progressId, stepId, { status: "done" });
      }

      if (createdPageId && builtTabs.length === 0) {
        await cleanupCreatedPage();
        appendMessage({
          role: "assistant",
          content: "I couldn't produce usable page content, so I removed the empty draft. Please try again with a little more detail.",
          isError: true,
        });
        return;
      }

      // 5. Mutual Action Plan
      if (plan.includeMap) {
        patchStep(progressId, "map", { status: "active" });
        try {
          await bridgeRef.current?.applyMapItems({
            title: plan.mapTitle,
            items: plan.mapItems,
          });
          patchStep(progressId, "map", { status: "done" });
        } catch {
          patchStep(progressId, "map", {
            status: "error",
            note: "Couldn't create the action plan",
          });
        }
      }

      // 6. Finalize + summary
      patchStep(progressId, "finalize", { status: "active" });
      if (firstTabId) bridgeRef.current?.activateTab(firstTabId);
      patchStep(progressId, "finalize", { status: "done" });

      const parts: string[] = [];
      parts.push(
        `Your page is ready. I created ${builtTabs.length} tab${builtTabs.length === 1 ? "" : "s"} — ${builtTabs.map((t) => t.name).join(", ")}.`
      );
      if (plan.cta && hasCta(builtDocs)) {
        parts.push(`The primary CTA is "${plan.cta.label}" on the ${plan.ctaTabName} tab.`);
      }
      if (plan.includeMap && (plan.mapItems?.length ?? 0) > 0) {
        parts.push(
          `I added a ${plan.mapItems!.length}-item Mutual Action Plan${plan.mapTitle ? ` ("${plan.mapTitle}")` : ""}.`
        );
      }
      if (plan.missingInfo.length > 0) {
        parts.push(
          `I couldn't find real details for: ${plan.missingInfo.join("; ")} — I used [placeholders] you should replace.`
        );
      }
      for (const name of failures) {
        parts.push(`The "${name}" tab didn't finish — ask me to retry it.`);
      }

      appendMessage({
        role: "assistant",
        content: parts.join(" "),
        suggestions: [
          ...failures.map((n) => `Retry the "${n}" tab`),
          ...plan.suggestions,
        ].slice(0, 5),
      });
    },
    [appendMessage, patchStep]
  );

  // ── Edit flow: one scoped-ops turn ────────────────────────────────────────

  const runEditFlow = useCallback(
    async (history: ChatMessage[]) => {
      setFlow("editing");
      const currentPage = pageRef.current;
      const bridge = bridgeRef.current;
      if (!currentPage || !bridge?.isReady) {
        appendMessage({
          role: "assistant",
          content: "The editor isn't ready yet — try again in a moment.",
          isError: true,
        });
        return;
      }

      const ctx = bridge.getContext();
      let res: EditResponse;
      try {
        res = await postComposer<EditResponse>(currentPage.id, {
          phase: "edit",
          messages: toApiHistory(history),
          context: {
            title: ctx.title,
            style: ctx.style,
            activeTabId: ctx.activeTabId,
            tabs: ctx.tabs,
            map: ctx.map
              ? {
                  title: ctx.map.title,
                  closeDate: ctx.map.closeDate,
                  items: ctx.map.items.map((i) => ({
                    id: i.id,
                    title: i.title,
                    ownerType: i.ownerType,
                    ownerName: i.ownerName,
                    dueDate: i.dueDate,
                    completed: i.completed,
                  })),
                }
              : null,
          },
        });
      } catch (err) {
        if (err instanceof ComposerError && err.code === "INSUFFICIENT_CREDITS") {
          setLimitError(err.message);
          return;
        }
        appendMessage({
          role: "assistant",
          content:
            err instanceof Error ? err.message : "The edit failed. Please try again.",
          isError: true,
        });
        return;
      }

      let replyText = res.reply;
      if (res.ops.length > 0) {
        const { failures } = await bridge.applyOps(res.ops as ComposerOp[]);
        if (failures.length > 0) {
          replyText += ` (Note: ${failures.join("; ")}.)`;
        }
      }

      appendMessage({
        role: "assistant",
        content: replyText,
        suggestions: res.suggestions,
      });
    },
    [appendMessage]
  );

  // ── Entry point ───────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string) => {
      const userMessage: ChatMessage = {
        id: nextMessageId(),
        role: "user",
        content: text,
      };
      let history: ChatMessage[] = [];
      setMessages((prev) => {
        history = [...prev, userMessage];
        return history;
      });

      try {
        // Route: brand-new/empty page → plan+build; anything with content → edit
        const ctx = bridgeRef.current?.isReady ? bridgeRef.current.getContext() : null;
        const isEmptyPage =
          !pageRef.current ||
          (!!ctx &&
            ctx.tabs.length <= 1 &&
            ctx.tabs.every((t) => docIsEmpty(t.content)) &&
            !ctx.map);

        if (isEmptyPage) {
          await runCreateFlow(history, text);
        } else {
          await runEditFlow(history);
        }
      } catch {
        appendMessage({
          role: "assistant",
          content: "Something went wrong. Please try again.",
          isError: true,
        });
      } finally {
        setFlow("idle");
        setHasBuilt(!!pageRef.current);
      }
    },
    [appendMessage, runCreateFlow, runEditFlow]
  );

  const buildingFirstPlan = flow === "planning" && !hasBuilt;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Chat panel */}
      <aside
        className={cn(
          "w-full md:w-[380px] md:flex shrink-0 border-r border-border flex-col h-full",
          mobileView === "chat" ? "flex" : "hidden"
        )}
      >
        {/* Shared panel header */}
        <div className="flex shrink-0 items-center gap-2.5 px-4 pb-3 pt-4">
          <span className="gradient-ai flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-elevation-1">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight text-foreground">
              Create with AI
            </p>
            <p className="text-2xs leading-tight text-muted-foreground">
              Describe your page — watch it build
            </p>
          </div>
        </div>

        {/* Pill tab switcher */}
        <div className="shrink-0 px-4 pb-3">
          <div className="flex items-center gap-1 rounded-full border border-border bg-muted/50 p-1">
            {(
              [
                { key: "chat", label: "Chat", Icon: MessageSquare },
                { key: "structure", label: "Structure", Icon: Layers },
                { key: "design", label: "Design", Icon: Palette },
              ] as const
            ).map(({ key, label, Icon }) => {
              const disabled = key !== "chat" && !editorState;
              return (
                <button
                  key={key}
                  onClick={() => !disabled && setPanelTab(key)}
                  disabled={disabled}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40",
                    panelTab === key
                      ? "bg-card text-foreground shadow-elevation-1"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active panel */}
        <div className="relative flex min-h-0 flex-1 flex-col">
          {/* Chat stays mounted so its scroll + state survive tab switches */}
          <div
            className={cn(
              "min-h-0 flex-1 flex-col",
              panelTab === "chat" ? "flex" : "hidden"
            )}
          >
            <AiChatPanel
              messages={messages}
              onSend={sendMessage}
              generating={generating}
              generatingLabel={generatingLabel}
              limitError={limitError}
              onClearLimitError={() => setLimitError(null)}
              hasPage={!!page}
            />
          </div>

          {panelTab === "structure" &&
            (editorState ? (
              <StructurePanel
                tabs={editorState.tabs}
                activeTabId={editorState.activeTabId}
                onSelect={(id) => bridgeRef.current?.activateTab(id)}
                onReorder={(ids) => {
                  void bridgeRef.current?.reorderTabs(ids);
                }}
                onRename={(id, name) => {
                  void bridgeRef.current?.renameTab(id, name);
                }}
                onDelete={(id) => {
                  void bridgeRef.current?.deleteTab(id);
                }}
                onAdd={() => {
                  void bridgeRef.current?.createTab(
                    `Section ${editorState.tabs.length + 1}`
                  );
                }}
              />
            ) : (
              <PanelHint label="Start building to organize sections here." />
            ))}

          {panelTab === "design" &&
            (editorState ? (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <StylePanel
                  style={editorState.style}
                  onChange={(patch) => bridgeRef.current?.setStyle(patch)}
                  password={editorState.password}
                  onPasswordChange={(v) => bridgeRef.current?.setPagePassword(v)}
                  passwordProtection={editorState.passwordProtection}
                />
              </div>
            ) : (
              <PanelHint label="Start building to style your page here." />
            ))}
        </div>
      </aside>

      {/* Live editor */}
      <div
        className={cn(
          "relative flex-1 min-w-0 h-full md:block",
          mobileView === "page" ? "block" : "hidden"
        )}
      >
        <div className="h-full overflow-y-auto">
          {page ? (
            <TiptapEditor
              page={page}
              isCreator
              aiBridgeRef={bridgeRef}
              aiBusy={generating}
              onEditorStateChange={setEditorState}
              hideDesign
            />
          ) : (
            !buildingFirstPlan && (
              <div className="flex h-full flex-col items-center justify-center gap-3 bg-muted/30 text-center px-6">
                <span className="gradient-ai flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md">
                  <Sparkles className="h-5 w-5" />
                </span>
                <p className="text-sm font-medium text-foreground">
                  Your page will appear here
                </p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Describe the deal — I&apos;ll plan the page, build it tab by
                  tab, and you can edit everything directly at any time.
                </p>
              </div>
            )
          )}
        </div>

        {/* Planning skeleton: covers the (empty) editor until the plan lands */}
        {buildingFirstPlan && <PageBuildingSkeleton />}

        {/* Edit lock while the AI works (the build itself is the show —
            keep the pill out of the way at the top) */}
        {generating && !buildingFirstPlan && (
          <div className="absolute inset-0 z-20 cursor-not-allowed" aria-hidden="true">
            <div className="absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 shadow-elevation-2">
              <span className="gradient-ai flex h-4 w-4 items-center justify-center rounded-full text-white">
                <Sparkles className="h-2.5 w-2.5" />
              </span>
              <span className="text-xs font-medium text-foreground">
                {flow === "building" ? "AI is building…" : "AI is editing…"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile chat/page toggle */}
      {page && (
        <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex rounded-full border border-border bg-background/95 backdrop-blur shadow-lg p-1">
          {(
            [
              { key: "chat", label: "Chat", Icon: MessageSquare },
              { key: "page", label: "Page", Icon: FileText },
            ] as const
          ).map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setMobileView(key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                mobileView === key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
