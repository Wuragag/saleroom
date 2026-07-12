import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkPageAccess } from "@/lib/team-auth";
import { put, del } from "@vercel/blob";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { withErrorHandler } from "@/lib/api-error";

// No SVG: next/image can't serve remote SVGs without dangerouslyAllowSVG,
// which this app deliberately keeps off (public bucket + optimizer surface).
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

const logoLimiter = rateLimit({ limit: 20, window: "60s", prefix: "logo" });

/**
 * Upload a page logo to Vercel Blob. Replaces the legacy base64-data-URL
 * flow (logos used to be inlined into the logoUrl column); old base64 values
 * still render — only the upload path changed.
 */
export const POST = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = await logoLimiter.limit(
    `${session.user.id}:${getClientIp(request)}`
  );
  if (!success) {
    return NextResponse.json(
      { error: "Too many uploads. Please slow down." },
      { status: 429 }
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN is not set");
    return NextResponse.json(
      { error: "Storage is not configured. Please contact support." },
      { status: 503 }
    );
  }

  const access = await checkPageAccess(id, "edit");
  if (!access.authorized) {
    const status = !access.session ? 401 : access.reason === "Page not found" ? 404 : 403;
    return NextResponse.json({ error: access.reason }, { status });
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
  const filename = `logos/${id}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const blob = await put(filename, buffer, { access: "public", contentType: file.type });

  // Best-effort cleanup of the old logo blob — but ONLY if this page owns it.
  // logoUrl can point at a shared blob (the team brand kit's logo inherited at
  // creation, or another page's logo carried over by duplicate); deleting those
  // would break every other page using them. Base64 legacy values are skipped
  // by the https check.
  const page = await prisma.page.findUnique({
    where: { id },
    select: { logoUrl: true },
  });
  if (page?.logoUrl?.startsWith("https://")) {
    try {
      if (new URL(page.logoUrl).pathname.startsWith(`/logos/${id}-`)) {
        del(page.logoUrl).catch(() => {});
      }
    } catch {
      // unparsable URL — leave it alone
    }
  }

  return NextResponse.json({ url: blob.url });
});
