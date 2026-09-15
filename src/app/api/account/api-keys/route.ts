import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  generateApiKey,
  apiKeyLockKey,
  MAX_API_KEYS_PER_USER,
  API_KEY_NAME_MAX,
} from "@/lib/api-keys";
import { withResourceLock } from "@/lib/plan-limits";
import { withErrorHandler, safeJson } from "@/lib/api-error";
import { cleanString } from "@/lib/validation";

const KEY_SELECT = {
  id: true,
  name: true,
  prefix: true,
  lastUsedAt: true,
  createdAt: true,
} as const;

/** GET /api/account/api-keys — the caller's keys (never the secrets). */
export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    select: KEY_SELECT,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ keys });
});

/**
 * POST /api/account/api-keys — mint a key. The plaintext `token` is returned
 * exactly once in this response and never stored.
 */
export const POST = withErrorHandler(async (request: Request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await safeJson<{ name?: unknown }>(request)) ?? {};
  const name = cleanString(body.name, API_KEY_NAME_MAX);
  if (!name) {
    return NextResponse.json({ error: "Key name is required" }, { status: 400 });
  }

  const userId = session.user.id;
  const generated = generateApiKey();

  // Count + create under the per-user advisory lock so concurrent requests
  // can't race past the cap (same pattern as the plan-limit asserts).
  const key = await withResourceLock(apiKeyLockKey(userId), async (tx) => {
    const count = await tx.apiKey.count({ where: { userId } });
    if (count >= MAX_API_KEYS_PER_USER) return null;
    return tx.apiKey.create({
      data: { name, prefix: generated.prefix, keyHash: generated.hash, userId },
      select: KEY_SELECT,
    });
  });
  if (!key) {
    return NextResponse.json(
      { error: `You can have at most ${MAX_API_KEYS_PER_USER} API keys. Revoke one first.` },
      { status: 400 }
    );
  }

  return NextResponse.json({ ...key, token: generated.token }, { status: 201 });
});
