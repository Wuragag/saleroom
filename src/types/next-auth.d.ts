// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from "next-auth";
import type { PlanLimits } from "@/lib/plan-limits";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      teamId?: string | null;
      teamRole?: "OWNER" | "MEMBER" | null;
      plan?: "FREE" | "PRO" | "TEAM";
      planLimits?: PlanLimits;
      isAdmin?: boolean;
    };
  }
}
