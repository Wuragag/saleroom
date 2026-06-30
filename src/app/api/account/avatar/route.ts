import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { put, del } from "@vercel/blob";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { withErrorHandler } from "@/lib/api-error";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

const avatarLimiter = rateLimit({ limit: 20, window: "60s", prefix: "avatar" });

export const POST = withErrorHandler(async (request: Request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = await avatarLimiter.limit(
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
        { error: "File size must be under 2 MB" },
        { status: 400 }
      );
    }

    const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
    const filename = `avatars/${session.user.id}-${Date.now()}.${ext}`;

    // Convert File → Buffer for maximum serverless compatibility
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Vercel Blob
    const blob = await put(filename, buffer, {
      access: "public",
      contentType: file.type,
    });

    // Best-effort cleanup of old avatar blob
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatarUrl: true },
    });
    if (user?.avatarUrl && user.avatarUrl.startsWith("https://")) {
      del(user.avatarUrl).catch(() => {});
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: blob.url },
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Avatar upload error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Upload failed: ${message}` },
      { status: 500 }
    );
  }
});
