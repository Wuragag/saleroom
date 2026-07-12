import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getUserTeamId, requireTeamOwner } from "@/lib/team-auth";
import { put, del } from "@vercel/blob";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { withErrorHandler } from "@/lib/api-error";

// No SVG: next/image can't serve remote SVGs without dangerouslyAllowSVG,
// which this app deliberately keeps off (public bucket + optimizer surface).
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

const logoLimiter = rateLimit({ limit: 20, window: "60s", prefix: "brand-logo" });

/**
 * Best-effort delete of a replaced/removed brand logo blob. Pages created
 * while it was active inherit its URL into Page.logoUrl, so the blob is only
 * deleted when this kit owns it AND no page still references it.
 */
function deleteOwnBrandLogo(teamId: string, logoUrl: string | null | undefined): void {
  if (!logoUrl?.startsWith("https://")) return;
  try {
    if (!new URL(logoUrl).pathname.startsWith(`/brand-logos/${teamId}-`)) return;
  } catch {
    return;
  }
  prisma.page
    .count({ where: { logoUrl } })
    .then((count) => {
      if (count === 0) return del(logoUrl);
    })
    .catch(() => {});
}

/** Upload the team brand logo to Vercel Blob (owner only). */
export const POST = withErrorHandler(async (request: Request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Same team the GET/settings UI shows (earliest membership) — see brand/route.ts
  const teamId = await getUserTeamId(session.user.id);
  if (!teamId) {
    return NextResponse.json({ error: "No team found" }, { status: 404 });
  }
  const owner = await requireTeamOwner(teamId);
  if (!owner.authorized) {
    return NextResponse.json(
      { error: owner.reason ?? "Not a team owner" },
      { status: owner.session ? 403 : 401 }
    );
  }

  const { success } = await logoLimiter.limit(
    `${session.user.id}:${getClientIp(request)}`
  );
  if (!success) {
    return NextResponse.json({ error: "Too many uploads. Please slow down." }, { status: 429 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN is not set");
    return NextResponse.json(
      { error: "Storage is not configured. Please contact support." },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG and WebP images are allowed" },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File size must be under 2 MB" }, { status: 400 });
  }

  const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const filename = `brand-logos/${teamId}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const blob = await put(filename, buffer, { access: "public", contentType: file.type });

  // Best-effort cleanup of the old logo blob — pages created while it was
  // active may still reference it, so only delete blobs this kit owns.
  const existing = await prisma.brandKit.findUnique({
    where: { teamId },
    select: { logoUrl: true },
  });
  deleteOwnBrandLogo(teamId, existing?.logoUrl);
  await prisma.brandKit.upsert({
    where: { teamId },
    update: { logoUrl: blob.url },
    create: { teamId, logoUrl: blob.url },
  });

  return NextResponse.json({ url: blob.url });
});

/** Remove the team brand logo (owner only). */
export const DELETE = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const teamId = await getUserTeamId(session.user.id);
  if (!teamId) {
    return NextResponse.json({ error: "No team found" }, { status: 404 });
  }
  const owner = await requireTeamOwner(teamId);
  if (!owner.authorized) {
    return NextResponse.json(
      { error: owner.reason ?? "Not a team owner" },
      { status: owner.session ? 403 : 401 }
    );
  }

  const existing = await prisma.brandKit.findUnique({
    where: { teamId },
    select: { logoUrl: true },
  });
  deleteOwnBrandLogo(teamId, existing?.logoUrl);
  await prisma.brandKit.upsert({
    where: { teamId },
    update: { logoUrl: "" },
    create: { teamId, logoUrl: "" },
  });

  return new NextResponse(null, { status: 204 });
});
