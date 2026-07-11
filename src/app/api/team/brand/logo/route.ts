import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeamOwner } from "@/lib/team-auth";
import { put, del } from "@vercel/blob";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { withErrorHandler } from "@/lib/api-error";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

const logoLimiter = rateLimit({ limit: 20, window: "60s", prefix: "brand-logo" });

/** Upload the team brand logo to Vercel Blob (owner only). */
export const POST = withErrorHandler(async (request: Request) => {
  const owner = await requireTeamOwner();
  if (!owner.authorized || !owner.teamId) {
    return NextResponse.json(
      { error: owner.reason ?? "Not a team owner" },
      { status: owner.session ? 403 : 401 }
    );
  }
  const teamId = owner.teamId;

  const { success } = await logoLimiter.limit(
    `${owner.session.user.id}:${getClientIp(request)}`
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
      { error: "Only JPEG, PNG, WebP and SVG images are allowed" },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File size must be under 2 MB" }, { status: 400 });
  }

  const ext =
    file.type === "image/jpeg" ? "jpg" : file.type === "image/svg+xml" ? "svg" : file.type.split("/")[1];
  const filename = `brand-logos/${teamId}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const blob = await put(filename, buffer, { access: "public", contentType: file.type });

  // Best-effort cleanup of the old logo blob, then persist the new URL
  const existing = await prisma.brandKit.findUnique({
    where: { teamId },
    select: { logoUrl: true },
  });
  if (existing?.logoUrl?.startsWith("https://")) {
    del(existing.logoUrl).catch(() => {});
  }
  await prisma.brandKit.upsert({
    where: { teamId },
    update: { logoUrl: blob.url },
    create: { teamId, logoUrl: blob.url },
  });

  return NextResponse.json({ url: blob.url });
});

/** Remove the team brand logo (owner only). */
export const DELETE = withErrorHandler(async () => {
  const owner = await requireTeamOwner();
  if (!owner.authorized || !owner.teamId) {
    return NextResponse.json(
      { error: owner.reason ?? "Not a team owner" },
      { status: owner.session ? 403 : 401 }
    );
  }
  const teamId = owner.teamId;

  const existing = await prisma.brandKit.findUnique({
    where: { teamId },
    select: { logoUrl: true },
  });
  if (existing?.logoUrl?.startsWith("https://")) {
    del(existing.logoUrl).catch(() => {});
  }
  await prisma.brandKit.upsert({
    where: { teamId },
    update: { logoUrl: "" },
    create: { teamId, logoUrl: "" },
  });

  return new NextResponse(null, { status: 204 });
});
