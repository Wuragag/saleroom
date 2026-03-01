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

  // Serialize dates for client component; strip password hash — client
  // only needs to know whether a password is set (boolean flag).
  const { password: _pw, ...pageWithoutPassword } = page;
  const serialized = {
    ...pageWithoutPassword,
    // The editor uses this as a truthy check to show the password UI
    password: _pw ? "••••••••" : "",
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
    tabs: page.tabs.map((tab) => ({
      ...tab,
      createdAt: tab.createdAt.toISOString(),
      updatedAt: tab.updatedAt.toISOString(),
    })),
  };

  const isCreator = page.userId === session.user.id;

  return (
    <TiptapEditor
      page={serialized}
      readOnly={!canEdit}
      lockedByName={isLockedByOther ? (page.lockedBy?.name ?? "another user") : undefined}
      isCreator={isCreator}
    />
  );
}
