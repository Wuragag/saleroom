import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { getUserTeamId } from "@/lib/team-auth";
import { checkDealAccess } from "@/lib/deal-auth";
import { getDealDetail, getMemberOptions } from "@/lib/deal-queries";
import { DealDetail } from "@/components/deals/deal-detail";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const access = await checkDealAccess(id, "view");
  // 404 for both missing and forbidden — don't leak deal existence.
  if (!access.authorized) notFound();

  const teamId = await getUserTeamId(session.user.id);
  const [deal, members] = await Promise.all([
    getDealDetail(id, session.user.id, teamId),
    getMemberOptions(session.user.id, teamId),
  ]);
  if (!deal) notFound();

  return (
    <AppShell>
      <DealDetail deal={deal} members={members} />
    </AppShell>
  );
}
