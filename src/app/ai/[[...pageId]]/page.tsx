import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { checkPageAccess } from "@/lib/team-auth";
import { AiWorkspace } from "@/components/ai/ai-workspace";

/**
 * "Create with AI" workspace.
 * /ai        → fresh chat, page is created on the first message
 * /ai/{id}   → chat beside an existing page
 */
export default async function AiWorkspacePage({
  params,
}: {
  params: Promise<{ pageId?: string[] }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { pageId } = await params;
  const id = pageId?.[0];

  if (!id) {
    return <AiWorkspace initialPage={null} />;
  }

  // The AI applies edits through the live editor, so full edit access
  // (and no lock held by someone else) is required — otherwise fall back
  // to the normal editor, which handles read-only display.
  const editAccess = await checkPageAccess(id, "edit");
  if (!editAccess.authorized) redirect(`/editor/${id}`);

  const page = await prisma.page.findUnique({
    where: { id },
    include: { tabs: { orderBy: { order: "asc" } } },
  });
  if (!page) redirect("/ai");
  if (page.lockedById !== null && page.lockedById !== session.user.id) {
    redirect(`/editor/${id}`);
  }

  // Serialize like /editor/[id]: ISO dates, password hash masked to a flag
  const { password: _pw, ...pageWithoutPassword } = page;
  const serialized = {
    ...pageWithoutPassword,
    password: _pw ? "••••••••" : "",
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
    tabs: page.tabs.map((tab) => ({
      ...tab,
      createdAt: tab.createdAt.toISOString(),
      updatedAt: tab.updatedAt.toISOString(),
    })),
  };

  return <AiWorkspace initialPage={serialized} />;
}
