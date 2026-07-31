import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import {
  PUB_TITLE_STYLE,
  PUB_LOGO_STYLE,
  PUB_EYEBROW_STYLE,
  PUB_SUBTITLE_STYLE,
  PUB_HERO_GAP,
} from "@/components/page-shell";
import {
  PUB_OVERLAY_TEXT_STYLE,
  PUB_OVERLAY_SUBTITLE_STYLE,
  PUB_OVERLAY_EYEBROW_STYLE,
} from "@/components/pub-cover";

export interface PageHeroParts {
  logo?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Gap between the hero block and the page content (PageShell heroGap). */
  gap: string;
}

export interface HeroLayoutStyles {
  layout: "left" | "centered" | "compact";
  gap: string;
  logo: CSSProperties;
  eyebrow: CSSProperties;
  title: CSSProperties;
  subtitle: CSSProperties;
}

/**
 * Per-element style overrides for the seller-chosen hero layout. Exported so
 * the editor's editable hero fields can apply the same overrides and stay
 * WYSIWYG with the published output.
 */
export function heroLayoutStyles(heroLayout?: string | null): HeroLayoutStyles {
  const layout =
    heroLayout === "centered" || heroLayout === "compact" ? heroLayout : "left";
  if (layout === "centered") {
    return {
      layout,
      gap: PUB_HERO_GAP,
      logo: { marginLeft: "auto", marginRight: "auto" },
      eyebrow: { textAlign: "center" },
      title: { textAlign: "center" },
      subtitle: {
        textAlign: "center",
        marginLeft: "auto",
        marginRight: "auto",
      },
    };
  }
  if (layout === "compact") {
    return {
      layout,
      gap: "2rem",
      logo: { height: "28px", marginBottom: "1.75rem" },
      eyebrow: { marginBottom: "0.875rem" },
      title: { fontSize: "clamp(1.75rem, 4vw, 2.5rem)" },
      subtitle: { fontSize: "1.0625rem", marginTop: "0.75rem" },
    };
  }
  return { layout, gap: PUB_HERO_GAP, logo: {}, eyebrow: {}, title: {}, subtitle: {} };
}

/**
 * The static hero elements (logo, eyebrow, title, subtitle) shared by
 * /p/[slug], /preview/[id] and the editor's read-only view, so the three
 * surfaces can't drift. With `overlay`, elements get the light-ink styles
 * for rendering on the cover scrim (PubCover's overlayContent). `heroLayout`
 * picks the arrangement: left (default), centered, or compact.
 */
export function buildPageHero(opts: {
  title: string;
  eyebrow?: string | null;
  subtitle?: string | null;
  logoUrl?: string | null;
  overlay: boolean;
  heroLayout?: string | null;
}): PageHeroParts {
  const { title, eyebrow, subtitle, logoUrl, overlay } = opts;
  const ls = heroLayoutStyles(opts.heroLayout);
  return {
    logo: logoUrl ? (
      <Image
        src={logoUrl}
        alt="Logo"
        width={180}
        height={36}
        style={{ ...PUB_LOGO_STYLE, ...ls.logo }}
      />
    ) : undefined,
    eyebrow: eyebrow ? (
      <span
        style={{
          ...PUB_EYEBROW_STYLE,
          ...ls.eyebrow,
          ...(overlay ? PUB_OVERLAY_EYEBROW_STYLE : {}),
        }}
      >
        {eyebrow}
      </span>
    ) : undefined,
    title: (
      <h1
        className="pub-title"
        style={{
          ...PUB_TITLE_STYLE,
          ...ls.title,
          ...(overlay ? PUB_OVERLAY_TEXT_STYLE : {}),
        }}
      >
        {title}
      </h1>
    ),
    subtitle: subtitle ? (
      <p
        style={{
          ...PUB_SUBTITLE_STYLE,
          ...ls.subtitle,
          ...(overlay ? PUB_OVERLAY_SUBTITLE_STYLE : {}),
        }}
      >
        {subtitle}
      </p>
    ) : undefined,
    gap: ls.gap,
  };
}
