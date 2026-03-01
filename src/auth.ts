import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getTeamPlan, PLAN_LIMITS } from "@/lib/plan-limits";
import { verifyImpersonateToken } from "@/lib/impersonation";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        impersonateToken: { label: "Impersonate Token" },
      },
      async authorize(credentials) {
        // ── Impersonation path ──────────────────────────────────────────────
        if (credentials?.impersonateToken) {
          const payload = verifyImpersonateToken(
            credentials.impersonateToken as string
          );
          if (!payload) return null;

          const [target, admin] = await Promise.all([
            prisma.user.findUnique({ where: { id: payload.targetUserId } }),
            prisma.user.findUnique({
              where: { id: payload.adminId },
              select: { id: true, name: true, email: true },
            }),
          ]);
          if (!target || !admin) return null;

          return {
            id: target.id,
            email: target.email,
            name: target.name,
            image: target.avatarUrl || null,
            onboardingCompleted: target.onboardingCompleted,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            impersonatedBy: admin.id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            impersonatedByName: admin.name,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            impersonatedByEmail: admin.email,
          };
        }

        // ── Normal email/password path ───────────────────────────────────────
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl || null,
          onboardingCompleted: user.onboardingCompleted,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.image = user.image;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.onboardingCompleted = (user as any).onboardingCompleted ?? false;

        // Fetch team membership (deterministic: earliest joined)
        const membership = await prisma.teamMember.findFirst({
          where: { userId: user.id as string },
          select: { teamId: true, role: true },
          orderBy: { createdAt: "asc" },
        });
        token.teamId = membership?.teamId ?? null;
        token.teamRole = membership?.role ?? null;

        // Fetch billing plan
        if (membership?.teamId) {
          const plan = await getTeamPlan(membership.teamId);
          token.plan = plan;
          token.planLimits = PLAN_LIMITS[plan];
        } else {
          token.plan = "FREE";
          token.planLimits = PLAN_LIMITS.FREE;
        }

        // Fetch admin status
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id as string },
          select: { isAdmin: true },
        });
        token.isAdmin = dbUser?.isAdmin ?? false;

        // Impersonation metadata (only set when signing in via impersonate token)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = user as any;
        if (u.impersonatedBy) {
          token.impersonatedBy = u.impersonatedBy;
          token.impersonatedByName = u.impersonatedByName;
          token.impersonatedByEmail = u.impersonatedByEmail;
        }
      }
      // When client calls update(), refresh user data from DB
      if (trigger === "update" && token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { name: true, email: true, avatarUrl: true, onboardingCompleted: true, isAdmin: true },
        });
        if (fresh) {
          token.name = fresh.name;
          token.email = fresh.email;
          token.image = fresh.avatarUrl || null;
          token.onboardingCompleted = fresh.onboardingCompleted;
          token.isAdmin = fresh.isAdmin;
        }
        // Refresh team membership (deterministic: earliest joined)
        const membership = await prisma.teamMember.findFirst({
          where: { userId: token.id as string },
          select: { teamId: true, role: true },
          orderBy: { createdAt: "asc" },
        });
        token.teamId = membership?.teamId ?? null;
        token.teamRole = membership?.role ?? null;

        // Refresh billing plan
        if (membership?.teamId) {
          const plan = await getTeamPlan(membership.teamId);
          token.plan = plan;
          token.planLimits = PLAN_LIMITS[plan];
        } else {
          token.plan = "FREE";
          token.planLimits = PLAN_LIMITS.FREE;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.image) session.user.image = token.image as string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session.user as any).onboardingCompleted = token.onboardingCompleted ?? false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session.user as any).teamId = token.teamId ?? null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session.user as any).teamRole = token.teamRole ?? null;
      // Billing
      session.user.plan = (token.plan as "FREE" | "PRO" | "TEAM") ?? "FREE";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      session.user.planLimits = token.planLimits as any ?? PLAN_LIMITS.FREE;
      session.user.isAdmin = (token.isAdmin as boolean) ?? false;
      // Impersonation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session.user as any).impersonatedBy = (token.impersonatedBy as string) ?? null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session.user as any).impersonatedByName = (token.impersonatedByName as string) ?? null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session.user as any).impersonatedByEmail = (token.impersonatedByEmail as string) ?? null;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: { strategy: "jwt" },
});
