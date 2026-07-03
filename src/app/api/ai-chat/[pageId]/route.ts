import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkPageAccess, getUserTeamId } from "@/lib/team-auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getTeamPlanLimits, PLAN_LIMITS } from "@/lib/plan-limits";
import {
  AI_CREDIT_COSTS,
  InsufficientCreditsError,
  chargeCredits,
  getRemainingCredits,
} from "@/lib/ai-credits";
import {
  callClaudeWithRetries,
  extractJson,
  sanitizeDoc,
  sanitizeStylePatch,
} from "@/lib/ai-page-generation";
import {
  buildPlanSystemPrompt,
  buildTabSystemPrompt,
  buildEditSystemPrompt,
  buildTabsInventoryJson,
  sanitizePlan,
  sanitizeOps,
  sanitizeSuggestions,
} from "@/lib/ai-composer";
import type {
  ComposerChatMessage,
  EditTabContext,
} from "@/types/ai-composer";

// Separate serverless function with its own timeout — each request is one
// (paid) completion: a plan, a single tab build, or an edit turn.
export const maxDuration = 60;

// User-initiated turns (plan starts a build; edit is one turn per message)
const chatLimiter = rateLimit({ limit: 10, window: "60s", prefix: "ai-chat" });
// Machine-fanned build calls: one per planned tab, gated upstream by the
// plan limiter (a build can't start without a plan turn).
const buildLimiter = rateLimit({ limit: 40, window: "60s", prefix: "ai-build" });

const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 4000;
const MAX_PLAN_TABS_FALLBACK = 8;

/** Validate & cap a client-supplied conversation (must end with a user turn). */
function parseMessages(raw: unknown): ComposerChatMessage[] | null {
  const rawMessages = Array.isArray(raw) ? raw : [];
  let messages: ComposerChatMessage[] = rawMessages
    .filter(
      (m): m is ComposerChatMessage =>
        !!m &&
        typeof m === "object" &&
        ((m as ComposerChatMessage).role === "user" ||
          (m as ComposerChatMessage).role === "assistant") &&
        typeof (m as ComposerChatMessage).content === "string" &&
        (m as ComposerChatMessage).content.length > 0
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }))
    .slice(-MAX_MESSAGES);

  // Anthropic requires the history to start with a user turn
  while (messages.length > 0 && messages[0].role !== "user") {
    messages = messages.slice(1);
  }
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return null;
  }
  return messages;
}

async function getSyncedBlockWhitelist(teamId: string | null | undefined) {
  if (!teamId) return [] as { id: string; name: string }[];
  try {
    return await prisma.syncedBlock.findMany({
      where: { teamId },
      select: { id: true, name: true },
      take: 50,
    });
  } catch {
    return [];
  }
}

/**
 * POST /api/ai-chat/[pageId]
 *
 * Sales-page composer endpoint. The client orchestrates a multi-phase
 * protocol via `body.phase`:
 *   "plan"      → { reply, plan }
 *   "build-tab" → { content, summary }        (one call per planned tab)
 *   "edit"      → { reply, ops, suggestions } (scoped changes, never full regen)
 * A missing phase falls back to the legacy single-shot behavior.
 *
 * The server never writes page data — the client applies results through
 * the live editor (single-writer, so autosave can't clobber them).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pageId } = await params;
  const access = await checkPageAccess(pageId, "edit");
  if (!access.authorized) {
    const status = !access.session ? 401 : 403;
    return NextResponse.json({ error: access.reason }, { status });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI is not configured on this server." },
      { status: 503 }
    );
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  let body: any;
  /* eslint-enable @typescript-eslint/no-explicit-any */
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const phase =
    body.phase === "plan" || body.phase === "build-tab" || body.phase === "edit"
      ? (body.phase as "plan" | "build-tab" | "edit")
      : null;
  if (!phase) {
    return NextResponse.json({ error: "Unknown phase" }, { status: 400 });
  }

  const limiter = phase === "build-tab" ? buildLimiter : chatLimiter;
  const { success } = await limiter.limit(
    `${session.user.id}:${getClientIp(request)}`
  );
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429 }
    );
  }

  let teamId: string | null = access.page?.teamId ?? null;
  if (!teamId) {
    // Legacy teamless page — fall back to the user's own team if they have
    // one (credits/plan-limit checks still need a scope either way).
    teamId = await getUserTeamId(session.user.id);
  }
  const userId = session.user.id;

  try {
    switch (phase) {
      case "plan":
        return await handlePlan(body, teamId, userId);
      case "build-tab":
        return await handleBuildTab(body, teamId, userId);
      case "edit":
        return await handleEdit(body, teamId, userId);
    }
  } catch (err) {
    if (err instanceof InsufficientCreditsError) return creditsErrorResponse(err);
    console.error(`AI chat error (phase=${phase}):`, err);
    return NextResponse.json(
      { error: "AI generation failed. Please try again." },
      { status: 502 }
    );
  }
}

function creditsErrorResponse(err: InsufficientCreditsError) {
  return NextResponse.json(
    { error: err.message, code: err.code, required: err.required, available: err.available },
    { status: 403 }
  );
}

// ── plan ────────────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
async function handlePlan(body: any, teamId: string | null, userId: string) {
  const messages = parseMessages(body.messages);
  if (!messages) {
    return NextResponse.json(
      { error: "The last message must be from the user." },
      { status: 400 }
    );
  }

  // Charge before the (paid) Claude call — no call made if this throws.
  await chargeCredits(teamId, userId, AI_CREDIT_COSTS.plan);

  const limits = teamId ? await getTeamPlanLimits(teamId) : PLAN_LIMITS.FREE;
  const maxTabs =
    limits.maxTabsPerPage === -1 ? MAX_PLAN_TABS_FALLBACK : limits.maxTabsPerPage;

  const responseText = await callClaudeWithRetries({
    system: buildPlanSystemPrompt({
      title: typeof body.context?.title === "string" ? body.context.title.slice(0, 200) : "Untitled Page",
      style: sanitizeStylePatch(body.context?.style),
      maxTabs,
    }),
    messages,
    maxTokens: 2048,
  });

  const parsed = extractJson(responseText);
  const plan = parsed ? sanitizePlan(parsed.plan, maxTabs) : null;
  if (!parsed || typeof parsed.reply !== "string" || !parsed.reply.trim() || !plan) {
    console.error("AI plan response unusable:", responseText.slice(0, 500));
    return NextResponse.json(
      { error: "AI couldn't produce a plan. Please try rephrasing." },
      { status: 422 }
    );
  }

  // Read-only "can the whole build be afforded" check — the plan call's own
  // cost was already charged above, so `remaining` reflects what's left for
  // the tab-build loop. The client (not this response) decides whether to
  // start that loop, so an unaffordable build creates zero tabs.
  const requiredForBuild = plan.tabs.length * AI_CREDIT_COSTS.buildTab;
  const { remaining } = await getRemainingCredits(teamId, userId);
  const credits = {
    remaining,
    requiredForBuild,
    sufficientForBuild: remaining === -1 || remaining >= requiredForBuild,
  };

  return NextResponse.json({ reply: parsed.reply.trim(), plan, credits });
}

// ── build-tab ───────────────────────────────────────────────────────────────

async function handleBuildTab(body: any, teamId: string | null, userId: string) {
  // Never trust the client-echoed plan — re-sanitize with the hard cap.
  const plan = sanitizePlan(body.plan, MAX_PLAN_TABS_FALLBACK);
  const tabName = typeof body.tabSpec?.name === "string" ? body.tabSpec.name.slice(0, 40) : "";
  const tabPurpose =
    typeof body.tabSpec?.purpose === "string" ? body.tabSpec.purpose.slice(0, 200) : "";
  const userRequest =
    typeof body.userRequest === "string" ? body.userRequest.slice(0, MAX_MESSAGE_CHARS) : "";
  if (!plan || !tabName || !userRequest) {
    return NextResponse.json({ error: "Invalid build request" }, { status: 400 });
  }

  // Charge after cheap validation but before the (paid) Claude call.
  await chargeCredits(teamId, userId, AI_CREDIT_COSTS.buildTab);

  const builtTabs = (Array.isArray(body.builtTabs) ? body.builtTabs : [])
    .filter((t: any) => t && typeof t === "object")
    .map((t: any) => ({
      name: String(t.name ?? "").slice(0, 40),
      summary: String(t.summary ?? "").slice(0, 200),
    }))
    .filter((t: { name: string }) => t.name)
    .slice(0, 8);

  const syncedBlocks = await getSyncedBlockWhitelist(teamId);

  const responseText = await callClaudeWithRetries({
    system: buildTabSystemPrompt({
      plan,
      tabSpec: { name: tabName, purpose: tabPurpose },
      builtTabs,
      style: sanitizeStylePatch(body.context?.style),
      syncedBlocks,
    }),
    messages: [
      {
        role: "user",
        content: `Original request: ${userRequest}\n\nBuild the "${tabName}" tab now.`,
      },
    ],
    maxTokens: 8192,
  });

  const parsed = extractJson(responseText);
  const content = parsed
    ? sanitizeDoc(parsed.content, {
        allowedSyncedBlockIds: new Set(syncedBlocks.map((b) => b.id)),
      })
    : null;
  if (!content) {
    console.error("AI build-tab response unusable:", responseText.slice(0, 500));
    return NextResponse.json(
      { error: "AI couldn't write this tab. Please try again." },
      { status: 422 }
    );
  }

  return NextResponse.json({
    content,
    summary: String(parsed?.summary ?? "").slice(0, 200),
  });
}

// ── edit ────────────────────────────────────────────────────────────────────

async function handleEdit(body: any, teamId: string | null, userId: string) {
  const messages = parseMessages(body.messages);
  if (!messages) {
    return NextResponse.json(
      { error: "The last message must be from the user." },
      { status: 400 }
    );
  }

  const ctx = body.context ?? {};
  const tabs: EditTabContext[] = (Array.isArray(ctx.tabs) ? ctx.tabs : [])
    .filter((t: any) => t && typeof t === "object" && typeof t.id === "string")
    .map((t: any) => ({
      id: String(t.id).slice(0, 64),
      name: String(t.name ?? "").slice(0, 40),
      content: t.content && typeof t.content === "object" ? t.content : null,
    }))
    .slice(0, 12);
  if (tabs.length === 0) {
    return NextResponse.json({ error: "No tabs in context" }, { status: 400 });
  }
  const activeTabId =
    typeof ctx.activeTabId === "string" ? ctx.activeTabId.slice(0, 64) : tabs[0].id;

  // Charge after cheap validation but before the (paid) Claude call.
  await chargeCredits(teamId, userId, AI_CREDIT_COSTS.edit);

  let mapJson = "null";
  if (ctx.map && typeof ctx.map === "object") {
    try {
      mapJson = JSON.stringify(ctx.map).slice(0, 8000);
    } catch {
      /* keep "null" */
    }
  }

  const syncedBlocks = await getSyncedBlockWhitelist(teamId);

  const responseText = await callClaudeWithRetries({
    system: buildEditSystemPrompt({
      title: typeof ctx.title === "string" ? ctx.title.slice(0, 200) : "Untitled Page",
      style: sanitizeStylePatch(ctx.style),
      activeTabId,
      tabsInventoryJson: buildTabsInventoryJson(tabs, activeTabId),
      mapJson,
      syncedBlocks,
    }),
    messages,
  });

  const parsed = extractJson(responseText);
  if (!parsed || typeof parsed.reply !== "string" || !parsed.reply.trim()) {
    console.error("AI edit response unusable:", responseText.slice(0, 500));
    return NextResponse.json(
      { error: "AI returned an unreadable response. Please try again." },
      { status: 422 }
    );
  }

  const ops = sanitizeOps(parsed.ops, {
    validTabIds: new Set(tabs.map((t) => t.id)),
    allowedSyncedBlockIds: new Set(syncedBlocks.map((b) => b.id)),
  });

  return NextResponse.json({
    reply: parsed.reply.trim(),
    ops,
    suggestions: sanitizeSuggestions(parsed.suggestions),
  });
}

/* eslint-enable @typescript-eslint/no-explicit-any */
