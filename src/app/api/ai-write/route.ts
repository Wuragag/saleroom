import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserTeamId } from "@/lib/team-auth";
import {
  assertCanCreatePageTx,
  withResourceLock,
  pageLockKey,
  PlanLimitError,
} from "@/lib/plan-limits";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { DEFAULT_TAB_NAME } from "@/lib/constants";
import slugify from "slugify";

const MAX_PROMPT_LENGTH = 2000;

// Each request can trigger a paid LLM completion — cap per user to stop abuse.
const aiWriteLimiter = rateLimit({ limit: 10, window: "60s", prefix: "ai-write" });

function generateSlug(title: string): string {
  const base = slugify(title, { lower: true, strict: true }) || "ai-page";
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

/**
 * POST /api/ai-write
 * Creates a page from a user's text prompt. Returns immediately (202).
 * AI processing happens via a separate POST /api/ai-write/process/[pageId].
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit per user (and IP) — these requests fan out to paid LLM calls.
  const { success } = await aiWriteLimiter.limit(
    `${session.user.id}:${getClientIp(request)}`
  );
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down and try again shortly." },
      { status: 429 }
    );
  }

  const teamId = await getUserTeamId(session.user.id);

  try {
    const body = await request.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return NextResponse.json(
        { error: "Please provide a description for your page." },
        { status: 400 }
      );
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `Prompt must be under ${MAX_PROMPT_LENGTH} characters.` },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI features are not configured. Please contact support." },
        { status: 503 }
      );
    }

    // Create page with "processing" status and store the prompt
    const placeholderTitle = "AI is writing…";
    let slug = generateSlug("ai-page");

    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.page.findUnique({ where: { slug } });
      if (!existing) break;
      slug = generateSlug("ai-page");
      attempts++;
    }

    const placeholderContent = JSON.stringify({
      type: "doc",
      content: [{ type: "paragraph" }],
    });

    // Atomic plan-limit enforcement + create (also caps teamless users at FREE).
    const page = await withResourceLock(
      pageLockKey(teamId, session.user.id),
      async (tx) => {
        await assertCanCreatePageTx(tx, teamId, session.user.id);
        return tx.page.create({
          data: {
            title: placeholderTitle,
            slug,
            content: placeholderContent,
            importStatus: "processing",
            importText: prompt, // Store the user's prompt for AI processing
            userId: session.user.id,
            teamId,
            tabs: {
              create: {
                name: DEFAULT_TAB_NAME,
                order: 0,
                content: placeholderContent,
              },
            },
          },
        });
      }
    );

    // Return immediately — frontend triggers processing separately
    return NextResponse.json(
      { id: page.id, status: "processing" },
      { status: 202 }
    );
  } catch (err) {
    if (err instanceof PlanLimitError) {
      return NextResponse.json(
        { error: err.message, code: err.code, current: err.current, limit: err.limit },
        { status: 403 }
      );
    }
    console.error("AI Write error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to create page: ${message}` },
      { status: 500 }
    );
  }
}
