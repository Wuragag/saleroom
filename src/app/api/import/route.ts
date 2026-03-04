import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserTeamId } from "@/lib/team-auth";
import { canCreatePage } from "@/lib/plan-limits";
import { extractText, isSupportedType } from "@/lib/document-parser";
import { DEFAULT_TAB_NAME } from "@/lib/constants";
import slugify from "slugify";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

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

  const teamId = await getUserTeamId(session.user.id);

  // Plan limit check
  if (teamId) {
    const limitCheck = await canCreatePage(teamId);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: limitCheck.reason,
          code: "PLAN_LIMIT",
          current: limitCheck.current,
          limit: limitCheck.limit,
        },
        { status: 403 }
      );
    }
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

    const page = await prisma.page.create({
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

    // Return immediately — frontend will trigger processing separately
    return NextResponse.json(
      { id: page.id, status: "processing" },
      { status: 202 }
    );
  } catch (err) {
    console.error("Import error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Import failed: ${message}` },
      { status: 500 }
    );
  }
}
