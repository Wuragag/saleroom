import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { checkPageAccess } from "@/lib/team-auth";
import { TiptapEditor } from "@/components/editor/tiptap-editor";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  // Check view access first
  const viewAccess = await checkPageAccess(id, "view");
  if (!viewAccess.authorized) notFound();

  const page = await prisma.page.findUnique({
    where: { id },
    include: {
      tabs: { orderBy: { order: "asc" } },
      lockedBy: { select: { id: true, name: true } },
    },
  });

  if (!page) notFound();

  // Determine if user can edit
  const editAccess = await checkPageAccess(id, "edit");
  const canEdit = editAccess.authorized;
  const isLockedByOther = page.lockedById !== null && page.lockedById !== session.user.id;

  // Serialize dates for client component
  const serialized = {
    ...page,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
    tabs: page.tabs.map((tab) => ({
      ...tab,
      createdAt: tab.createdAt.toISOString(),
      updatedAt: tab.updatedAt.toISOString(),
    })),
  };

  return (
    <TiptapEditor
      page={serialized}
      readOnly={!canEdit}
      lockedByName={isLockedByOther ? (page.lockedBy?.name ?? "another user") : undefined}
    />
  );
}
