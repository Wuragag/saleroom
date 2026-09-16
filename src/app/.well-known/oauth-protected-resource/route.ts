import { NextResponse } from "next/server";
import { protectedResourceMetadata } from "@/lib/oauth";

export const dynamic = "force-dynamic";

/** RFC 9728 — the MCP endpoint's resource metadata (pointed to by its 401). */
export function GET(request: Request) {
  return NextResponse.json(protectedResourceMetadata(new URL(request.url).origin), {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
