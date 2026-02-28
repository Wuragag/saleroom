import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserTeamId } from "@/lib/team-auth";
import { SubmissionsTable } from "@/components/submissions-table";
import { AppNav } from "@/components/app-nav";

export default async function SubmissionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const teamId = await getUserTeamId(session.user.id);

  const pages = await prisma.page.findMany({
    where: teamId
      ? {
          OR: [
            { teamId, visibility: "TEAM" },
            { userId: session.user.id, visibility: "PRIVATE" },
          ],
        }
      : { userId: session.user.id },
    select: { id: true, title: true, slug: true },
    orderBy: { title: "asc" },
  });

  const pageIds = pages.map((p) => p.id);

  const submissions = await prisma.formSubmission.findMany({
    where: { pageId: { in: pageIds } },
    include: { page: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });

  const serialized = submissions.map((s) => ({
    id: s.id,
    pageId: s.pageId,
    formId: s.formId,
    data: s.data,
    createdAt: s.createdAt.toISOString(),
    pageTitle: s.page.title,
  }));

  return (
    <main className="min-h-screen bg-background">
      <AppNav />
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Form Submissions
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            View and export form submissions from your pages
          </p>
        </div>
        <SubmissionsTable submissions={serialized} pages={pages} />
      </div>
    </main>
  );
}
