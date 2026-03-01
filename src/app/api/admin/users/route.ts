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
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        teamMemberships: {
          orderBy: { createdAt: "asc" },
          take: 1,
          select: {
            role: true,
            team: {
              select: {
                id: true,
                name: true,
                subscription: {
                  select: { plan: true, status: true },
                },
              },
            },
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const formatted = users.map((u) => {
    const membership = u.teamMemberships[0];
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      isAdmin: u.isAdmin,
      createdAt: u.createdAt,
      role: membership?.role ?? null,
      team: membership?.team
        ? {
            id: membership.team.id,
            name: membership.team.name,
            plan: membership.team.subscription?.plan ?? "FREE",
            status: membership.team.subscription?.status ?? "ACTIVE",
          }
        : null,
    };
  });

  return NextResponse.json({ users: formatted, total, page });
}
