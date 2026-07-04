import { prisma } from "@/lib/prisma";
import { getUserTeamId } from "@/lib/team-auth";
import { AI_CREDIT_COSTS, InsufficientCreditsError, chargeCredits } from "@/lib/ai-credits";
import {
  buildImportSystemPrompt,
  callClaudeWithRetries,
  extractJson,
  sanitizeDoc,
} from "@/lib/ai-page-generation";

export interface ImportProcessResult {
  status: string;
  error?: string;
  code?: string;
}

/**
 * Claim and process one imported page. The extracted text is kept on retryable
 * failures so an admin/user retry can actually rerun the AI conversion.
 */
export async function processImportedPage(
  pageId: string,
  userId: string
): Promise<ImportProcessResult> {
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: {
      id: true,
      userId: true,
      importStatus: true,
      importText: true,
    },
  });

  if (!page || page.userId !== userId) {
    return { status: "error", error: "Not found" };
  }

  const claim = await prisma.page.updateMany({
    where: { id: pageId, userId, importStatus: "processing" },
    data: { importStatus: "generating" },
  });
  if (claim.count === 0) {
    const fresh = await prisma.page.findUnique({
      where: { id: pageId },
      select: { importStatus: true, importError: true },
    });
    return {
      status: fresh?.importStatus ?? "complete",
      error: fresh?.importError ?? undefined,
    };
  }

  if (!page.importText) {
    await prisma.page.update({
      where: { id: pageId },
      data: {
        importStatus: "error",
        importError: "No extracted text found. Please re-upload.",
      },
    });
    return { status: "error", error: "No extracted text" };
  }

  try {
    const teamId = await getUserTeamId(userId);
    await chargeCredits(teamId, userId, AI_CREDIT_COSTS.import);

    const responseText = await callClaudeWithRetries({
      system: buildImportSystemPrompt(),
      messages: [
        {
          role: "user",
          content: `Convert the following document text into Tiptap JSON:\n\n${page.importText}`,
        },
      ],
    });

    const parsed = extractJson(responseText) as {
      title?: string;
      content?: unknown;
    } | null;
    const content = parsed ? sanitizeDoc(parsed.content) : null;

    if (!parsed || !content) {
      const error = parsed
        ? "AI returned unsupported document content. Please retry the import."
        : `AI returned invalid output. Raw start: ${responseText.slice(0, 120)}`;
      console.error("Claude import response was unusable:", responseText.slice(0, 500));
      await prisma.page.update({
        where: { id: pageId },
        data: {
          importStatus: "error",
          importError: error,
        },
      });
      return { status: "error", error };
    }

    if (!parsed.title) {
      const error = "AI returned a document without a title. Please retry the import.";
      await prisma.page.update({
        where: { id: pageId },
        data: {
          importStatus: "error",
          importError: error,
        },
      });
      return { status: "error", error };
    }

    const title = parsed.title.slice(0, 200);
    const contentJson = JSON.stringify(content);

    await prisma.page.update({
      where: { id: pageId },
      data: {
        title,
        content: contentJson,
        importStatus: "complete",
        importError: null,
        importText: null,
        tabs: {
          updateMany: {
            where: { pageId },
            data: { content: contentJson },
          },
        },
      },
    });

    return { status: "complete" };
  } catch (err) {
    console.error("AI processing error:", err);

    if (err instanceof InsufficientCreditsError) {
      await prisma.page.update({
        where: { id: pageId },
        data: {
          importStatus: "error",
          importError: err.message,
        },
      });
      return { status: "error", error: err.message, code: err.code };
    }

    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    await prisma.page.update({
      where: { id: pageId },
      data: {
        importStatus: "error",
        importError: `AI processing failed: ${errorMessage}`,
      },
    });
    return { status: "error", error: errorMessage };
  }
}
