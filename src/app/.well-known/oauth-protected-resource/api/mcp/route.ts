import { NextResponse } from "next/server";
import { protectedResourceMetadata } from "@/lib/oauth";

export const dynamic = "force-dynamic";

/** Path-suffixed variant some clients probe first (RFC 9728 §3.1). */
export function GET(request: Request) {
  return NextResponse.json(protectedResourceMetadata(new URL(request.url).origin), {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
