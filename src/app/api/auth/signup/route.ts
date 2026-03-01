import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const limiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 });

export async function POST(request: Request) {
  // Rate limit: 3 signups per minute per IP
  const ip = getClientIp(request);
  const { success } = limiter.check(ip, 3);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { name, email, password, company } = body as {
      name: string;
      email: string;
      password: string;
      company?: string;
    };

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Normalize email to lowercase to prevent case-sensitive duplicates
    const normalizedEmail = email.toLowerCase().trim();

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    // Create user + team + membership in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email: normalizedEmail, password: hashed, company: company || "" },
        select: { id: true, email: true, name: true, company: true },
      });

      const teamName = user.company || `${user.name}'s Team`;
      const team = await tx.team.create({
        data: { name: teamName },
      });

      await tx.teamMember.create({
        data: {
          userId: user.id,
          teamId: team.id,
          role: "OWNER",
        },
      });

      return { id: user.id, email: user.email, name: user.name };
    });

    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
