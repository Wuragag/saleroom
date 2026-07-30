import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { getUserTeamId } from "@/lib/team-auth";
import { listCompanies, listContacts } from "@/lib/contact-queries";
import { ContactsWorkspace } from "@/components/deals/contacts-workspace";

export default async function ContactsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingCompleted: true },
  });
  if (!currentUser?.onboardingCompleted) redirect("/onboarding");

  const teamId = await getUserTeamId(session.user.id);
  const [contacts, companies] = await Promise.all([
    listContacts(session.user.id, teamId),
    listCompanies(session.user.id, teamId),
  ]);

  return (
    <AppShell>
      <ContactsWorkspace
        contacts={contacts}
        companies={companies.map((c) => ({ id: c.id, name: c.name }))}
      />
    </AppShell>
  );
}
