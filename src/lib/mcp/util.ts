/**
 * Small helpers shared by the MCP tool modules: the bound principal, uniform
 * result shaping, and error → tool-error translation.
 */
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { PlanLimitError } from "@/lib/plan-limits";

/**
 * Who the server is acting as. Bound once per server instance (one instance
 * per request in stateless HTTP mode), so tools never read auth from `extra`.
 */
export interface McpPrincipal {
  userId: string;
  /** Earliest-joined team (getUserTeamId) — null for legacy teamless users. */
  teamId: string | null;
  /** Origin for absolute links (derived from the request, never from env). */
  appUrl: string;
}

/** A successful result: JSON for humans in `content`, and as structuredContent. */
export function ok(data: Record<string, unknown>, summary?: string): CallToolResult {
  const text = JSON.stringify(data, null, 2);
  return {
    content: [{ type: "text", text: summary ? `${summary}\n\n${text}` : text }],
    structuredContent: data,
  };
}

/** A tool-level failure the model can read and recover from. */
export function fail(message: string): CallToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

/**
 * Wraps a tool handler so domain errors become readable tool errors instead
 * of opaque JSON-RPC failures. Plan caps and unique-constraint collisions are
 * the two the model can actually act on; everything else propagates (the SDK
 * turns it into an isError result with the message).
 */
export function guard<A>(
  fn: (args: A) => Promise<CallToolResult>
): (args: A) => Promise<CallToolResult> {
  return async (args) => {
    try {
      return await fn(args);
    } catch (err) {
      if (err instanceof PlanLimitError) return fail(`Plan limit: ${err.message}`);
      if (isPrismaCode(err, "P2002")) return fail("A record with this value already exists.");
      if (isPrismaCode(err, "P2025")) return fail("Record not found.");
      throw err;
    }
  };
}

function isPrismaCode(err: unknown, code: string): boolean {
  return (
    err instanceof Error &&
    err.name === "PrismaClientKnownRequestError" &&
    (err as { code?: string }).code === code
  );
}

export function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

export function publicPageUrl(appUrl: string, slug: string): string {
  return `${appUrl.replace(/\/$/, "")}/p/${slug}`;
}

export function editorUrl(appUrl: string, pageId: string): string {
  return `${appUrl.replace(/\/$/, "")}/editor/${pageId}`;
}

export function dealUrl(appUrl: string, dealId: string): string {
  return `${appUrl.replace(/\/$/, "")}/deals/${dealId}`;
}

/** `tags` is stored as a JSON string; tolerate legacy/corrupt values. */
export function parseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t === "string") : [];
  } catch {
    return [];
  }
}

/** Access-check failure → tool error with the ACL's own reason. */
export function denied(reason: string | undefined, fallback = "Forbidden"): CallToolResult {
  return fail(reason ?? fallback);
}

/**
 * Busts the ISR cache for a published page after a content change. Wrapped
 * because revalidatePath only works inside a Next.js request scope — the
 * in-memory test harness calls tools without one.
 */
export async function bustPublishedPage(slug: string | null | undefined): Promise<void> {
  if (!slug) return;
  try {
    const { revalidatePath } = await import("next/cache");
    revalidatePath(`/p/${slug}`);
  } catch {
    /* outside a request scope (tests) — nothing to bust */
  }
}
