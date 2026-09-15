import { NextResponse } from "next/server";
import { authorizationServerMetadata } from "@/lib/oauth";

export const dynamic = "force-dynamic";

/** RFC 8414 — how OAuth clients (claude.ai, ChatGPT) find our endpoints. */
export function GET(request: Request) {
  return NextResponse.json(authorizationServerMetadata(new URL(request.url).origin), {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
