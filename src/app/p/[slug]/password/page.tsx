import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import crypto from "crypto";
import { Lock } from "lucide-react";
import { PubGate, PUB_GATE_STYLES } from "@/components/pub-gate";

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
    select: {
      id: true,
      title: true,
      slug: true,
      password: true,
      accentColor: true,
      background: true,
      font: true,
      headingFont: true,
      themeRadius: true,
      themeDepth: true,
      logoUrl: true,
    },
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

  const hasError = resolvedSearchParams.error === "1";

  // Explicit style object — never spread the row here: it carries the bcrypt
  // password hash, and PubGate is shared with a client component graph.
  return (
    <PubGate
      style={{
        accentColor: page.accentColor,
        background: page.background,
        font: page.font,
        headingFont: page.headingFont,
        themeRadius: page.themeRadius,
        themeDepth: page.themeDepth,
        logoUrl: page.logoUrl,
      }}
      icon={<Lock className="h-5 w-5" />}
      title="Enter password"
      description={
        <>
          Enter the password to view{" "}
          <span
            className="font-medium"
            style={{ color: "var(--pub-heading-color, #111827)" }}
          >
            {page.title}
          </span>
          .
        </>
      }
    >
      {/* Error message */}
      {hasError && (
        <div
          role="alert"
          className="mb-4 px-3 py-2 text-sm text-center"
          style={PUB_GATE_STYLES.error}
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
            style={PUB_GATE_STYLES.label}
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoFocus
            aria-label="Password"
            className="w-full px-3 py-2.5 text-sm transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            style={{
              ...PUB_GATE_STYLES.input,
              // @ts-expect-error - CSS custom props for the per-page accent focus ring are not fully typed
              "--tw-ring-color": "var(--pub-accent-safe)",
              "--tw-ring-offset-color": "var(--pub-surface)",
            }}
            placeholder="Enter password…"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2.5 px-4 text-sm font-semibold transition-opacity hover:opacity-90 active:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...PUB_GATE_STYLES.button,
            // @ts-expect-error - CSS custom props for the per-page accent focus ring are not fully typed
            "--tw-ring-color": "var(--pub-accent-safe)",
            "--tw-ring-offset-color": "var(--pub-surface)",
          }}
        >
          Unlock page
        </button>
      </form>
    </PubGate>
  );
}
