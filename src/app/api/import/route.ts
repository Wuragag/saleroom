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
import { AI_CREDIT_COSTS, InsufficientCreditsError, assertHasCredits } from "@/lib/ai-credits";
import { extractText, isSupportedType } from "@/lib/document-parser";
import { DEFAULT_TAB_NAME } from "@/lib/constants";
import slugify from "slugify";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Each import parses a document server-side and triggers a paid LLM call —
// cap per user to stop CPU/cost abuse.
const importLimiter = rateLimit({ limit: 10, window: "60s", prefix: "import" });

function generateSlug(title: string): string {
  const base = slugify(title, { lower: true, strict: true }) || "imported";
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

/**
 * Step 1: Accept file, extract text, create page, return immediately.
 * The AI processing happens via a separate POST /api/import/process/[pageId].
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit per user (and IP) before doing any parsing or paid work.
  const { success } = await importLimiter.limit(
    `${session.user.id}:${getClientIp(request)}`
  );
  if (!success) {
    return NextResponse.json(
      { error: "Too many import requests. Please slow down and try again shortly." },
      { status: 429 }
    );
  }

  const teamId = await getUserTeamId(session.user.id);

  // Read-only fast-fail before spending CPU on parsing — the actual charge
  // happens in the process step, right before the real Claude call.
  try {
    await assertHasCredits(teamId, session.user.id, AI_CREDIT_COSTS.import);
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return NextResponse.json(
        { error: err.message, code: err.code, required: err.required, available: err.available },
        { status: 403 }
      );
    }
    throw err;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!isSupportedType(file.type)) {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Please upload a PDF, DOCX, or PPTX file.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File must be under 10 MB" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI features are not configured. Please contact support." },
        { status: 503 }
      );
    }

    // Extract text from document
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text: string;
    try {
      text = await extractText(buffer, file.type);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json({ error: message }, { status: 422 });
    }

    // Create page with "processing" status and store extracted text
    const placeholderTitle = "Importing document…";
    let slug = generateSlug("imported");

    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.page.findUnique({ where: { slug } });
      if (!existing) break;
      slug = generateSlug("imported");
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
            importText: text, // Store extracted text for the processing step
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

    // Return immediately — frontend will trigger processing separately
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
    console.error("Import error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Import failed: ${message}` },
      { status: 500 }
    );
  }
}
