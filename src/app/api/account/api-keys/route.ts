import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  generateApiKey,
  MAX_API_KEYS_PER_USER,
  API_KEY_NAME_MAX,
} from "@/lib/api-keys";
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

  const count = await prisma.apiKey.count({ where: { userId: session.user.id } });
  if (count >= MAX_API_KEYS_PER_USER) {
    return NextResponse.json(
      { error: `You can have at most ${MAX_API_KEYS_PER_USER} API keys. Revoke one first.` },
      { status: 400 }
    );
  }

  const generated = generateApiKey();
  const key = await prisma.apiKey.create({
    data: {
      name,
      prefix: generated.prefix,
      keyHash: generated.hash,
      userId: session.user.id,
    },
    select: KEY_SELECT,
  });

  return NextResponse.json({ ...key, token: generated.token }, { status: 201 });
});
