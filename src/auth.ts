import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
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
      }
      // When client calls update(), refresh user data from DB
      if (trigger === "update" && token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { name: true, email: true, avatarUrl: true, onboardingCompleted: true },
        });
        if (fresh) {
          token.name = fresh.name;
          token.email = fresh.email;
          token.image = fresh.avatarUrl || null;
          token.onboardingCompleted = fresh.onboardingCompleted;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.image) session.user.image = token.image as string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session.user as any).onboardingCompleted = token.onboardingCompleted ?? false;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: { strategy: "jwt" },
});
