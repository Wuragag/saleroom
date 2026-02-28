"use client";

import { getBgHex, getAccentColor } from "@/lib/page-styles";

interface PageThumbnailProps {
  title: string;
  background: string;
  accentColor: string;
}

export function PageThumbnail({ title, background, accentColor }: PageThumbnailProps) {
  const bgHex = getBgHex(background);
  const accent = getAccentColor(accentColor);
  const isDark = background === "dark";

  const textColor = isDark ? "rgba(240,239,233,0.88)" : "rgba(15,23,42,0.82)";
  const lineBase = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";

  return (
    <div
      className="w-full aspect-video rounded-t-xl overflow-hidden relative select-none"
      style={{ backgroundColor: bgHex }}
    >
      {/* Top accent stripe */}
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: accent }} />

      {/* Radial accent glow top-right */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 90% 0%, ${accent}22 0%, transparent 65%)`,
        }}
      />

      {/* Content */}
      <div className="absolute inset-0 px-4 pt-5 pb-4 flex flex-col gap-0">
        {/* Mini title */}
        <p
          className="text-[9px] font-bold truncate leading-tight"
          style={{ color: textColor, maxWidth: "75%" }}
        >
          {title}
        </p>

        {/* Accent underline bar */}
        <div
          className="mt-1.5 mb-2.5 h-[2px] rounded-full"
          style={{ width: "32px", backgroundColor: accent, opacity: 0.7 }}
        />

        {/* Mock content lines */}
        {[82, 96, 68, 88, 54, 74].map((w, i) => (
          <div
            key={i}
            className="rounded-full mb-1"
            style={{
              width: `${w}%`,
              height: i === 0 ? "5px" : "4px",
              backgroundColor: lineBase,
              opacity: 1 - i * 0.06,
            }}
          />
        ))}

        {/* Mock block element (form / CTA) */}
        <div
          className="mt-auto rounded-md"
          style={{
            height: "16px",
            width: "52%",
            backgroundColor: `${accent}22`,
            border: `1px solid ${accent}44`,
          }}
        />
      </div>
    </div>
  );
}
