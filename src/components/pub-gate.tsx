import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { getAccentColor, getBgHex, getFontStyle } from "@/lib/page-styles";
import { getPubCssVars, isDarkBackground } from "@/lib/pub-theme";

/**
 * Shared shell for the buyer-facing access gates (password + email) so both
 * render in the page's own brand — accent ramp, background, fonts, radius and
 * depth — instead of app chrome. All colors ride on the --pub-* variables
 * emitted by getPubCssVars, which also fixes dark handling: isDarkBackground
 * covers every dark background key (dark AND navy).
 */

export interface PubGatePageStyle {
  accentColor: string;
  background: string | null;
  font: string;
  headingFont?: string | null;
  themeRadius?: string | null;
  themeDepth?: string | null;
  logoUrl?: string | null;
}

interface PubGateProps {
  style: PubGatePageStyle;
  /** Icon rendered inside the accent-tinted circle. */
  icon: ReactNode;
  title: string;
  description: ReactNode;
  /** The gate's form. */
  children: ReactNode;
  /** Small print under the card. */
  footnote?: ReactNode;
  /** Extra head elements (e.g. font links) rendered inside the shell. */
  head?: ReactNode;
}

/** Form-control styles shared by both gates — themed via --pub-* vars. */
export const PUB_GATE_STYLES = {
  label: {
    color: "var(--pub-muted-color, #6b7280)",
  } as CSSProperties,
  input: {
    backgroundColor: "var(--pub-surface, #f9fafb)",
    border: "1px solid var(--pub-divider, #d1d5db)",
    color: "var(--pub-heading-color, #111827)",
    borderRadius: "var(--pub-radius-sm, 8px)",
  } as CSSProperties,
  button: {
    backgroundColor: "var(--pub-accent, #17171a)",
    color: "var(--pub-accent-ink, #ffffff)",
    borderRadius: "var(--pub-radius-sm, 8px)",
  } as CSSProperties,
  error: {
    backgroundColor: "rgba(220, 38, 38, 0.08)",
    color: "#dc2626",
    border: "1px solid rgba(220, 38, 38, 0.25)",
    borderRadius: "var(--pub-radius-sm, 8px)",
  } as CSSProperties,
};

export function PubGate({
  style,
  icon,
  title,
  description,
  children,
  footnote,
  head,
}: PubGateProps) {
  const accentColor = getAccentColor(style.accentColor);
  const bgHex = getBgHex(style.background ?? "white");
  const fontStyle = getFontStyle(style.font);
  const isDark = isDarkBackground(style.background);
  const cssVars = getPubCssVars({
    accentColor,
    background: style.background,
    font: style.font,
    headingFont: style.headingFont,
    themeRadius: style.themeRadius,
    themeDepth: style.themeDepth,
  });

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: bgHex, ...fontStyle, ...cssVars }}
    >
      {head}
      <div className="w-full max-w-sm">
        {style.logoUrl && (
          <Image
            src={style.logoUrl}
            alt="Logo"
            width={160}
            height={32}
            className="object-contain mb-8 mx-auto"
            style={{ height: "32px", width: "auto" }}
          />
        )}

        <div
          className="p-8"
          style={{
            backgroundColor: isDark
              ? "var(--pub-card-bg, rgba(255,255,255,0.05))"
              : "#ffffff",
            border: "1px solid var(--pub-divider, #e5e7eb)",
            borderRadius: "var(--pub-radius-lg, 16px)",
            boxShadow: "var(--pub-shadow-md, 0 4px 16px rgba(0,0,0,0.07))",
          }}
        >
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{
              backgroundColor: `color-mix(in srgb, var(--pub-accent, ${accentColor}) 10%, transparent)`,
              color: "var(--pub-accent-safe, #17171a)",
            }}
          >
            {icon}
          </div>

          <h1
            className="text-xl font-bold text-center mb-1.5"
            style={{
              color: "var(--pub-heading-color, #111827)",
              fontFamily: "var(--pub-font-heading, var(--pub-font-body, inherit))",
            }}
          >
            {title}
          </h1>
          <p
            className="text-sm text-center mb-6"
            style={{ color: "var(--pub-muted-color, #6b7280)" }}
          >
            {description}
          </p>

          {children}
        </div>

        {footnote && (
          <p
            className="text-xs text-center mt-4 px-4"
            style={{ color: "var(--pub-muted-color, #6b7280)", opacity: 0.8 }}
          >
            {footnote}
          </p>
        )}
      </div>
    </main>
  );
}
