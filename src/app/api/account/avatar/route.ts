import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { put, del } from "@vercel/blob";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Upload to Vercel Blob (works in serverless — no local filesystem needed)
    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type,
    });

    // Clean up old avatar blob
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatarUrl: true },
    });
    if (user?.avatarUrl && user.avatarUrl.startsWith("https://")) {
      del(user.avatarUrl).catch(() => {}); // Best-effort cleanup
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: blob.url },
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Avatar upload error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
