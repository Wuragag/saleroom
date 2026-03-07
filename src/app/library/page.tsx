import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserTeamId } from "@/lib/team-auth";
import { getTeamPlanLimits } from "@/lib/plan-limits";
import { SyncedBlockLibrary } from "@/components/synced-block-library";
import { AppNav } from "@/components/app-nav";

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const teamId = await getUserTeamId(session.user.id);
  if (!teamId) redirect("/");

  const [blocks, planLimits] = await Promise.all([
    prisma.syncedBlock.findMany({
      where: { teamId },
      orderBy: { updatedAt: "desc" },
      include: { createdBy: { select: { name: true } } },
    }),
    getTeamPlanLimits(teamId),
  ]);

  const serialized = blocks.map((b) => ({
    id: b.id,
    name: b.name,
    content: b.content,
    updatedAt: b.updatedAt.toISOString(),
    createdAt: b.createdAt.toISOString(),
    createdBy: { name: b.createdBy.name },
  }));

  return (
    <main className="min-h-screen bg-background">
      <AppNav />
      <div className="max-w-5xl mx-auto px-6 py-6">
        <SyncedBlockLibrary
          initialBlocks={serialized}
          maxBlocks={planLimits.maxSyncedBlocks}
          plan={planLimits.plan}
        />
      </div>
    </main>
  );
}
