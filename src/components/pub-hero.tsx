import type { ReactNode } from "react";
import Image from "next/image";
import {
  PUB_TITLE_STYLE,
  PUB_LOGO_STYLE,
  PUB_EYEBROW_STYLE,
  PUB_SUBTITLE_STYLE,
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
}

/**
 * The static hero elements (logo, eyebrow, title, subtitle) shared by
 * /p/[slug], /preview/[id] and the editor's read-only view, so the three
 * surfaces can't drift. With `overlay`, elements get the light-ink styles
 * for rendering on the cover scrim (PubCover's overlayContent).
 */
export function buildPageHero(opts: {
  title: string;
  eyebrow?: string | null;
  subtitle?: string | null;
  logoUrl?: string | null;
  overlay: boolean;
}): PageHeroParts {
  const { title, eyebrow, subtitle, logoUrl, overlay } = opts;
  return {
    logo: logoUrl ? (
      <Image src={logoUrl} alt="Logo" width={180} height={36} style={PUB_LOGO_STYLE} />
    ) : undefined,
    eyebrow: eyebrow ? (
      <span style={{ ...PUB_EYEBROW_STYLE, ...(overlay ? PUB_OVERLAY_EYEBROW_STYLE : {}) }}>
        {eyebrow}
      </span>
    ) : undefined,
    title: (
      <h1
        className="pub-title"
        style={{ ...PUB_TITLE_STYLE, ...(overlay ? PUB_OVERLAY_TEXT_STYLE : {}) }}
      >
        {title}
      </h1>
    ),
    subtitle: subtitle ? (
      <p style={{ ...PUB_SUBTITLE_STYLE, ...(overlay ? PUB_OVERLAY_SUBTITLE_STYLE : {}) }}>
        {subtitle}
      </p>
    ) : undefined,
  };
}
