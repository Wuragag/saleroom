import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const limiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 });

export async function POST(request: Request) {
  // Rate limit: 3 password-reset requests per minute per IP
  const ip = getClientIp(request);
  const { success } = limiter.check(ip, 3);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { email: rawEmail } = await request.json() as { email: string };

    if (!rawEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Normalize email to match how signup stores it
    const email = rawEmail.toLowerCase().trim();

    // Always return success to avoid leaking whether the email exists
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // Delete any existing tokens for this email
      await prisma.passwordResetToken.deleteMany({ where: { email } });

      // Generate a secure random token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: { email, token, expiresAt },
      });

      await sendPasswordResetEmail(email, token);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
