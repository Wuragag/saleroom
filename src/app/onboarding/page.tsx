import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, onboardingCompleted: true },
  });

  if (!user) redirect("/auth/signin");
  if (user.onboardingCompleted) redirect("/");

  return <OnboardingFlow userName={user.name} />;
}
