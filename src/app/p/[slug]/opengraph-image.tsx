import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { APP_NAME } from "@/lib/constants";
import { getAccentColor, getBgHex } from "@/lib/page-styles";
import { isDarkBackground } from "@/lib/pub-theme";
import { hexAlpha } from "@/lib/pub-color";

/**
 * Link-preview image for shared pages: the page's own background, accent
 * wash, logo, eyebrow and title — so a pasted link looks branded in Slack,
 * email and LinkedIn instead of a bare URL. Password-protected pages render
 * a neutral lock card and leak nothing.
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 60;

/**
 * satori resolves remote <img src> with a bare server-side fetch (no host
 * allowlist, no redirect guard), so only first-party Blob-hosted images may
 * reach it — a hostile URL here would be an SSRF primitive. Everywhere else
 * these fields render through next/image, which enforces the same host via
 * remotePatterns (next.config.mjs).
 */
function trustedImageUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return null;
    return u.hostname.endsWith(".public.blob.vercel-storage.com") ? raw : null;
  } catch {
    return null;
  }
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await prisma.page.findFirst({
    where: { slug, published: true },
    select: {
      title: true,
      eyebrow: true,
      password: true,
      requireEmail: true,
      accentColor: true,
      background: true,
      logoUrl: true,
      coverImage: true,
    },
  });

  const accent = getAccentColor(page?.accentColor ?? "");
  const bgHex = getBgHex(page?.background ?? "white");
  const isDark = isDarkBackground(page?.background);
  const heading = isDark ? "#f8fafc" : "#111318";
  const muted = isDark ? "rgba(248,250,252,0.62)" : "rgba(17,19,24,0.55)";
  // Gated pages (password or email) must not leak content into the preview
  // image — a declined gate or a link-unfurling bot would see it otherwise.
  const isPrivate = !page || Boolean(page.password) || Boolean(page.requireEmail);
  const logoUrl = trustedImageUrl(page?.logoUrl ?? null);
  const coverUrl = trustedImageUrl(page?.coverImage ?? null);

  const washBackground = [
    `radial-gradient(ellipse 900px 540px at 85% -10%, ${hexAlpha(accent, isDark ? 0.32 : 0.16)} 0%, ${hexAlpha(accent, 0)} 62%)`,
    `radial-gradient(ellipse 700px 480px at -5% 105%, ${hexAlpha(accent, isDark ? 0.22 : 0.1)} 0%, ${hexAlpha(accent, 0)} 60%)`,
  ].join(", ");

  const showCoverBackdrop = !isPrivate && Boolean(coverUrl);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: bgHex,
          position: "relative",
        }}
      >
        {/* Cover backdrop, dimmed so the title stays readable */}
        {showCoverBackdrop && (
          <img
            src={coverUrl!}
            alt=""
            width={size.width}
            height={size.height}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.28,
            }}
          />
        )}
        {/* Accent wash */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background: washBackground,
          }}
        />
        {/* Accent top bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 14,
            display: "flex",
            backgroundColor: accent,
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            padding: "0 96px",
            position: "relative",
          }}
        >
          {!isPrivate && logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              height={56}
              style={{ height: 56, objectFit: "contain", alignSelf: "flex-start", marginBottom: 44 }}
            />
          )}

          {isPrivate ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 30,
                  fontWeight: 600,
                  color: muted,
                  marginBottom: 18,
                }}
              >
                🔒  Private page
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 58,
                  fontWeight: 700,
                  color: heading,
                  letterSpacing: "-0.02em",
                }}
              >
                {page?.password
                  ? "This page is password-protected"
                  : "A page was shared with you"}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {page?.eyebrow && (
                <div
                  style={{
                    display: "flex",
                    fontSize: 26,
                    fontWeight: 700,
                    color: accent,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: 20,
                  }}
                >
                  {page.eyebrow}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  fontSize: page && page.title.length > 60 ? 56 : 72,
                  fontWeight: 800,
                  color: heading,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.08,
                }}
              >
                {page?.title ?? APP_NAME}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 96px 52px",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: accent,
              marginRight: 14,
            }}
          />
          <div style={{ display: "flex", fontSize: 24, fontWeight: 600, color: muted }}>
            {APP_NAME}
          </div>
        </div>
      </div>
    ),
    size
  );
}
