import { googleFontsHref } from "@/lib/pub-fonts";

/**
 * Loads the Google Fonts stylesheet for a page's selected font keys.
 * Rendered in the body rather than <head> (React 18 has no stylesheet
 * hoisting) — browsers still fetch and apply it, and `display=swap` keeps
 * text visible meanwhile. Buyer pages pass just [page.font,
 * page.headingFont]; the editor passes ALL_PUB_FONT_KEYS so the font picker
 * previews render true and switching is instant.
 */
export function PubFontLinks({
  fontKeys,
}: {
  fontKeys: (string | null | undefined)[];
}) {
  const href = googleFontsHref(fontKeys);
  if (!href) return null;
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link rel="stylesheet" href={href} />
    </>
  );
}
