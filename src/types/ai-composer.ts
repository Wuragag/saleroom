import type { JSONContent } from "@tiptap/core";
import type { PageStyle } from "@/lib/page-styles";

/**
 * Shared protocol types for the AI sales-page composer.
 * Client-safe: types only, no server imports.
 *
 * The composer runs as a client-orchestrated multi-phase protocol on
 * POST /api/ai-chat/[pageId]:
 *   plan      → infer sales context, propose structure (fast, small)
 *   build-tab → write ONE tab's content (called once per planned tab)
 *   edit      → scoped ops against the existing page (never full regen)
 */

export type ComposerPhase = "plan" | "build-tab" | "edit";

export interface PlanTabSpec {
  name: string;
  purpose: string;
}

export interface ComposerMapItemInput {
  title: string;
  ownerType: "seller" | "buyer";
  ownerName?: string;
  /** Model outputs day offsets; the server converts to an ISO dueDate. */
  dueDateOffsetDays?: number;
  dueDate?: string | null;
}

export interface ComposerPlan {
  pageType: string;
  title: string;
  style?: Partial<PageStyle>;
  tabs: PlanTabSpec[];
  /** Which tab carries the single primary CTA button (null = no CTA). */
  ctaTabName: string | null;
  cta: { label: string; url?: string } | null;
  includeMap: boolean;
  mapTitle?: string;
  mapItems?: ComposerMapItemInput[];
  /** Facts the model could not find — surfaced to the user after the build. */
  missingInfo: string[];
  /** Follow-up action chips offered after the build. */
  suggestions: string[];
}

// ── Requests ────────────────────────────────────────────────────────────────

export interface ComposerChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface PlanRequest {
  phase: "plan";
  messages: ComposerChatMessage[];
  context: { title: string; style: Partial<PageStyle> };
}

export interface BuildTabRequest {
  phase: "build-tab";
  /** The original user prompt that started the build. */
  userRequest: string;
  /** Existing tab to persist the generated content into, when available. */
  tabId?: string;
  /** Echo of the sanitized plan — the server re-sanitizes, never trusts it. */
  plan: ComposerPlan;
  tabSpec: PlanTabSpec;
  /** One-line summaries of already-built tabs, for continuity. */
  builtTabs: { name: string; summary: string }[];
  context: { style: Partial<PageStyle> };
}

export interface EditTabContext {
  id: string;
  name: string;
  content: JSONContent | null;
}

export interface EditRequest {
  phase: "edit";
  messages: ComposerChatMessage[];
  context: {
    title: string;
    style: Partial<PageStyle>;
    activeTabId: string;
    tabs: EditTabContext[];
    map: {
      title: string;
      closeDate: string | null;
      items: {
        id: string;
        title: string;
        ownerType: string;
        ownerName: string;
        dueDate: string | null;
        completed: boolean;
      }[];
    } | null;
  };
}

// ── Responses ───────────────────────────────────────────────────────────────

export interface PlanResponse {
  reply: string;
  plan: ComposerPlan;
  /** Read-only afford-check for the whole build (plan + one call per tab).
   *  The server doesn't block on this — the client decides whether to start
   *  the per-tab build loop, so an unaffordable build creates zero tabs. */
  credits: {
    remaining: number; // -1 = unlimited
    requiredForBuild: number;
    sufficientForBuild: boolean;
  };
}

export interface BuildTabResponse {
  content: JSONContent;
  /** One-line summary of what this tab covers (fed to later tab builds). */
  summary: string;
}

export type ComposerOp =
  | { op: "updateTab"; tabId: string; content: JSONContent }
  | { op: "renameTab"; tabId: string; name: string }
  | { op: "addTab"; name: string; content: JSONContent }
  | { op: "setTitle"; title: string }
  | { op: "setStyle"; style: Partial<PageStyle> }
  | {
      op: "setMap";
      title?: string;
      closeDate?: string | null;
      /** REPLACES the item list — the client diffs by title to preserve `completed`. */
      items?: ComposerMapItemInput[];
    }
  | { op: "removeMap" };

export interface EditResponse {
  reply: string;
  ops: ComposerOp[];
  suggestions: string[];
}
