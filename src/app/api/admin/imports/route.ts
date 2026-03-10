import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { withErrorHandler } from "@/lib/api-error";

export const GET = withErrorHandler(async (request: Request) => {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  // Only pages that went through the import flow
  const baseWhere: Record<string, unknown> = {
    importStatus: { not: null },
  };

  // Filter by specific status
  if (status && ["processing", "complete", "error"].includes(status)) {
    baseWhere.importStatus = status;
  }

  // Search by title or user email
  if (search) {
    baseWhere.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { user: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [imports, total] = await Promise.all([
    prisma.page.findMany({
      where: baseWhere,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        importStatus: true,
        importError: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.page.count({ where: baseWhere }),
  ]);

  return NextResponse.json({ imports, total, page });
});
