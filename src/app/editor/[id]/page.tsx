import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { TiptapEditor } from "@/components/editor/tiptap-editor";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const page = await prisma.page.findUnique({
    where: { id },
    include: { tabs: { orderBy: { order: "asc" } } },
  });

  if (!page) notFound();
  if (page.userId !== session.user.id) notFound();

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

  return <TiptapEditor page={serialized} />;
}
