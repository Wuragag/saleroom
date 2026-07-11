import type { CSSProperties, ReactNode } from "react";
import NextImage from "next/image";
import { getCoverHeight } from "@/lib/pub-theme";

interface PubCoverProps {
  src: string;
  coverHeight?: string | null;
  coverLayout?: string | null;
  maxWidth: string;
  /**
   * Hero content rendered on top of the cover in overlay layout
   * (logo/eyebrow/title/subtitle — the caller moves them here from the column).
   */
  overlayContent?: ReactNode;
}

/**
 * Published-page cover image, shared by /p/[slug], /preview/[id] and the
 * editor's read-only mode. Supports the seller-chosen height scale and the
 * "overlay" layout: hero text sits on the image over a bottom scrim so the
 * page opens like a title slide.
 */
export function PubCover({ src, coverHeight, coverLayout, maxWidth, overlayContent }: PubCoverProps) {
  const height = getCoverHeight(coverHeight, coverLayout);
  const overlay = coverLayout === "overlay" && overlayContent;
  return (
    <div className="relative z-10 w-full" style={{ height: `${height}px` }}>
      <NextImage src={src} alt="" fill sizes="100vw" priority style={{ objectFit: "cover" }} />
      {overlay && (
        <>
          {/* Bottom scrim so the hero text stays readable on any image */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(8,8,12,0.68) 0%, rgba(8,8,12,0.28) 52%, rgba(8,8,12,0.04) 78%, transparent 100%)",
            }}
          />
          <div className="absolute inset-x-0 bottom-0">
            <div className="mx-auto px-6 pb-10" style={{ maxWidth }}>
              {overlayContent}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Style overrides for hero text placed on the cover scrim: fixed light ink
 * (the scrim guarantees contrast regardless of page background/ramp).
 */
export const PUB_OVERLAY_TEXT_STYLE: CSSProperties = {
  color: "#ffffff",
};

export const PUB_OVERLAY_SUBTITLE_STYLE: CSSProperties = {
  color: "rgba(255,255,255,0.82)",
};

export const PUB_OVERLAY_EYEBROW_STYLE: CSSProperties = {
  color: "rgba(255,255,255,0.9)",
};
