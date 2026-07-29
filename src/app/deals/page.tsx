import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { getUserTeamId } from "@/lib/team-auth";
import { getMemberOptions, listDealsWithRollups } from "@/lib/deal-queries";
import { DealsWorkspace } from "@/components/deals/deals-workspace";

export default async function DealsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  // Check onboarding from DB (not JWT) to avoid stale-token redirect loops
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingCompleted: true },
  });
  if (!currentUser?.onboardingCompleted) redirect("/onboarding");

  const teamId = await getUserTeamId(session.user.id);

  const [deals, members] = await Promise.all([
    listDealsWithRollups(session.user.id, teamId),
    getMemberOptions(session.user.id, teamId),
  ]);

  return (
    <AppShell>
      <DealsWorkspace
        deals={deals}
        members={members}
        currentUserId={session.user.id}
      />
    </AppShell>
  );
}
