import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import crypto from "crypto";
import Image from "next/image";
import { getAccentColor, getBgHex, getFontStyle } from "@/lib/page-styles";
import { Lock } from "lucide-react";

export default async function PasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const page = await prisma.page.findFirst({
    where: { slug, published: true },
    select: { id: true, title: true, slug: true, password: true, accentColor: true, background: true, font: true, logoUrl: true },
  });

  if (!page) notFound();

  // If no password set, redirect back to the page
  if (!page.password) redirect(`/p/${page.slug}`);

  // If already authenticated, redirect to the page
  const cookieStore = await cookies();
  const token = cookieStore.get(`page_auth_${page.id}`)?.value;
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET or NEXTAUTH_SECRET must be set");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${page.id}:${page.password}`)
    .digest("hex");
  if (token === expected) redirect(`/p/${page.slug}`);

  const accentColor = getAccentColor(page.accentColor);
  const bgHex = getBgHex(page.background);
  const fontStyle = getFontStyle(page.font);
  const isDark = page.background === "dark";
  const textColor = isDark ? "#f3f4f6" : "#111827";
  const subtextColor = isDark ? "#9ca3af" : "#6b7280";
  const hasError = resolvedSearchParams.error === "1";

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: bgHex, ...fontStyle }}
    >
      <div className="w-full max-w-sm">
        {page.logoUrl && (
          <Image
            src={page.logoUrl}
            alt="Logo"
            width={160}
            height={32}
            className="object-contain mb-8 mx-auto"
            style={{ height: "32px", width: "auto" }}
          />
        )}

        <div
          className="rounded-2xl border p-8 shadow-sm"
          style={{
            backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
            borderColor: isDark ? "rgba(255,255,255,0.12)" : "#e5e7eb",
          }}
        >
          {/* Lock icon */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${accentColor}18` }}
          >
            <Lock className="h-5 w-5" style={{ color: accentColor }} />
          </div>

          {/* Title */}
          <h1
            className="text-xl font-bold text-center mb-1"
            style={{ color: textColor }}
          >
            {page.title}
          </h1>
          <p className="text-sm text-center mb-6" style={{ color: subtextColor }}>
            This page is password protected.
          </p>

          {/* Error message */}
          {hasError && (
            <div className="mb-4 px-3 py-2 rounded-lg text-sm text-center"
              style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
            >
              Incorrect password. Please try again.
            </div>
          )}

          {/* Form */}
          <form action={`/api/pages/${page.id}/auth`} method="POST">
            <input type="hidden" name="slug" value={page.slug} />
            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-xs font-medium mb-1.5"
                style={{ color: subtextColor }}
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoFocus
                className="w-full px-3 py-2.5 text-sm rounded-lg border focus:outline-none transition-colors"
                style={{
                  backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#f9fafb",
                  borderColor: isDark ? "rgba(255,255,255,0.15)" : "#d1d5db",
                  color: textColor,
                  // @ts-expect-error - focus ring via inline style not fully typed
                  "--tw-ring-color": accentColor,
                }}
                placeholder="Enter password…"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 active:opacity-80"
              style={{ backgroundColor: accentColor, color: "#ffffff" }}
            >
              Unlock Page
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
