import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  const where = search
    ? { name: { contains: search, mode: "insensitive" as const } }
    : {};

  const [teams, total] = await Promise.all([
    prisma.team.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
        subscription: {
          select: {
            plan: true,
            status: true,
            stripeCustomerId: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
          },
        },
        _count: {
          select: {
            members: true,
            pages: true,
          },
        },
        members: {
          where: { role: "OWNER" },
          take: 1,
          select: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    }),
    prisma.team.count({ where }),
  ]);

  const formatted = teams.map((t) => ({
    id: t.id,
    name: t.name,
    createdAt: t.createdAt,
    plan: t.subscription?.plan ?? "FREE",
    status: t.subscription?.status ?? "ACTIVE",
    stripeCustomerId: t.subscription?.stripeCustomerId ?? null,
    currentPeriodEnd: t.subscription?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: t.subscription?.cancelAtPeriodEnd ?? false,
    memberCount: t._count.members,
    pageCount: t._count.pages,
    owner: t.members[0]?.user ?? null,
  }));

  return NextResponse.json({ teams: formatted, total, page });
}
