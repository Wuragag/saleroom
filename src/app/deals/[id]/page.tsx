import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { getUserTeamId } from "@/lib/team-auth";
import { checkDealAccess } from "@/lib/deal-auth";
import { getDealDetail, getMemberOptions } from "@/lib/deal-queries";
import { ensurePipelineStages } from "@/lib/pipeline-stages";
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
  const deal = await getDealDetail(id, session.user.id, teamId);
  if (!deal) notFound();

  // Stages come from the DEAL's scope, matching what PATCH validates against —
  // otherwise a legacy teamless deal (owner has since joined a team) would be
  // offered columns the server rejects.
  const [members, stages] = await Promise.all([
    getMemberOptions(session.user.id, teamId),
    ensurePipelineStages(deal.owner.id, deal.teamId),
  ]);

  // Mirrors the comment-delete rule the API enforces (author, else deal owner
  // or team OWNER) so the moderation control isn't hidden from the role it
  // was built for.
  const canModerate = (await checkDealAccess(id, "delete")).authorized;

  return (
    <AppShell>
      <DealDetail
        deal={deal}
        members={members}
        stages={stages.map((s) => ({ id: s.id, name: s.name, order: s.order }))}
        currentUserId={session.user.id}
        canModerate={canModerate}
      />
    </AppShell>
  );
}
