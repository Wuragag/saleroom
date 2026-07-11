import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { isPageGateSatisfied } from "@/lib/page-gate";

/** GET /api/map/[slug] — fetch MAP for a published page (public, buyer-facing) */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const page = await prisma.page.findFirst({
    where: { slug, published: true },
    select: { id: true, requireEmail: true, password: true },
  });
  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  // The MAP is gated content: enforce the same email/password gates as the
  // server-rendered page so it can't be read by hitting this API directly.
  const cookieStore = await cookies();
  const gated = await isPageGateSatisfied(page, (name) => cookieStore.get(name)?.value);
  if (!gated) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const map = await prisma.mutualActionPlan.findUnique({
    where: { pageId: page.id },
    include: { items: { orderBy: { order: "asc" } } },
  });

  if (!map) {
    return NextResponse.json({ map: null });
  }

  return NextResponse.json({ map });
}
