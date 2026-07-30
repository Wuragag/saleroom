import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { getUserTeamId } from "@/lib/team-auth";
import { listCompanies } from "@/lib/contact-queries";
import { CompaniesWorkspace } from "@/components/deals/companies-workspace";

export default async function CompaniesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingCompleted: true },
  });
  if (!currentUser?.onboardingCompleted) redirect("/onboarding");

  const teamId = await getUserTeamId(session.user.id);
  const companies = await listCompanies(session.user.id, teamId);

  return (
    <AppShell>
      <CompaniesWorkspace companies={companies} />
    </AppShell>
  );
}
