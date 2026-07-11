import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { AcceptInviteCard } from "./accept-invite-card";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invite = await prisma.teamInvite.findUnique({
    where: { token },
    include: {
      team: { select: { name: true } },
      invitedBy: { select: { name: true } },
    },
  });

  if (!invite) notFound();

  if (invite.status !== "PENDING") {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-card border border-border rounded-xl p-8 text-center">
          <h1 className="text-lg font-semibold text-foreground mb-2">
            Invite {invite.status === "ACCEPTED" ? "Already Accepted" : "Expired"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {invite.status === "ACCEPTED"
              ? "This invite has already been accepted."
              : "This invite has expired. Please ask the team owner for a new one."}
          </p>
          <a
            href="/auth/signin"
            className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
          >
            Go to sign in
          </a>
        </div>
      </main>
    );
  }

  if (new Date() > invite.expiresAt) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-card border border-border rounded-xl p-8 text-center">
          <h1 className="text-lg font-semibold text-foreground mb-2">Invite Expired</h1>
          <p className="text-sm text-muted-foreground">
            This invite has expired. Please ask the team owner for a new one.
          </p>
          <a
            href="/auth/signin"
            className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
          >
            Go to sign in
          </a>
        </div>
      </main>
    );
  }

  const session = await auth();

  if (!session?.user?.id) {
    // Not signed in — show sign in / sign up links with redirect back
    const callbackUrl = `/invite/${token}`;
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-card border border-border rounded-xl p-8 text-center">
          <h1 className="text-lg font-semibold text-foreground mb-2">
            Join {invite.team.name}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {invite.invitedBy.name} invited you to join{" "}
            <strong>{invite.team.name}</strong> on {APP_NAME}. Sign in or create
            an account to accept.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="w-full inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold h-10 px-4 hover:bg-primary/90 transition-colors"
            >
              Sign in
            </a>
            <a
              href={`/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="w-full inline-flex items-center justify-center rounded-lg border border-border text-sm font-semibold h-10 px-4 hover:bg-muted transition-colors"
            >
              Create account
            </a>
          </div>
        </div>
      </main>
    );
  }

  // Signed in — show accept button
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <AcceptInviteCard
        token={token}
        teamName={invite.team.name}
        inviterName={invite.invitedBy.name}
      />
    </main>
  );
}
