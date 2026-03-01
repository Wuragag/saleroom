import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkPageAccess } from "@/lib/team-auth";
import { put, del } from "@vercel/blob";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Upload to Vercel Blob (works in serverless — no local filesystem needed)
    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type,
    });

    // Clean up old cover image blob to prevent storage bloat
    const page = await prisma.page.findUnique({
      where: { id },
      select: { coverImage: true },
    });
    if (page?.coverImage && page.coverImage.startsWith("https://")) {
      del(page.coverImage).catch(() => {}); // Best-effort cleanup
    }

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Cover upload error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
