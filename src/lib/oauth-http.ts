/**
 * Request/response plumbing shared by the OAuth route handlers: form or JSON
 * body parsing, RFC 6749 error responses, and rate limiters.
 */
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const NO_STORE = { "Cache-Control": "no-store", Pragma: "no-cache" } as const;

export const registerLimiter = rateLimit({ limit: 20, window: "1h", prefix: "rl:oauth:register" });
export const tokenLimiter = rateLimit({ limit: 60, window: "60s", prefix: "rl:oauth:token" });
export const authorizeLimiter = rateLimit({ limit: 30, window: "60s", prefix: "rl:oauth:authorize" });

/** Token/revoke endpoints accept form encoding (the standard) and JSON (lenient). */
export async function readOAuthBody(request: Request): Promise<Record<string, string | undefined>> {
  const type = request.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) {
      const json = (await request.json()) as Record<string, unknown>;
      const out: Record<string, string | undefined> = {};
      for (const [k, v] of Object.entries(json ?? {})) {
        if (typeof v === "string") out[k] = v;
      }
      return out;
    }
    const text = await request.text();
    const params = new URLSearchParams(text);
    const out: Record<string, string | undefined> = {};
    params.forEach((v, k) => {
      out[k] = v;
    });
    return out;
  } catch {
    return {};
  }
}

export function oauthError(
  error: string,
  description: string,
  status = 400,
  extraHeaders: Record<string, string> = {}
): NextResponse {
  return NextResponse.json(
    { error, error_description: description },
    { status, headers: { ...NO_STORE, ...extraHeaders } }
  );
}

export function oauthJson(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: NO_STORE });
}
