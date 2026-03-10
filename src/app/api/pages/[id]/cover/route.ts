import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkPageAccess } from "@/lib/team-auth";
import { put, del } from "@vercel/blob";
import { withErrorHandler } from "@/lib/api-error";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const POST = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, and WebP images are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size must be under 5 MB" },
        { status: 400 }
      );
    }

    const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const filename = `covers/${id}-${Date.now()}.${ext}`;

    // Convert File → Buffer for maximum serverless compatibility
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Vercel Blob
    const blob = await put(filename, buffer, {
      access: "public",
      contentType: file.type,
    });

    // Best-effort cleanup of old cover image blob
    const page = await prisma.page.findUnique({
      where: { id },
      select: { coverImage: true },
    });
    if (page?.coverImage && page.coverImage.startsWith("https://")) {
      del(page.coverImage).catch(() => {});
    }

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Cover upload error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Upload failed: ${message}` },
      { status: 500 }
    );
  }
});
