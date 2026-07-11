"use client";

import { useLayoutEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { PUB_EYEBROW_STYLE, PUB_SUBTITLE_STYLE } from "@/components/page-shell";

interface EditableHeroTextProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  variant: "eyebrow" | "subtitle";
  /** Hidden when empty in read-only mode; shows a ghost placeholder when editing */
  placeholder: string;
}

/**
 * Editable hero eyebrow/subtitle, styled exactly like the published page's
 * (page-shell.tsx PUB_EYEBROW_STYLE / PUB_SUBTITLE_STYLE) so what you type is
 * what visitors see. Follows the EditableTitle auto-grow pattern.
 */
export function EditableHeroText({ value, onChange, readOnly, variant, placeholder }: EditableHeroTextProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      el.style.height = "0px";
      el.style.height = `${el.scrollHeight}px`;
    };
    measure();
    let lastWidth = el.clientWidth;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth !== lastWidth) {
        lastWidth = el.clientWidth;
        measure();
      }
    });
    observer.observe(el);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => observer.disconnect();
  }, [value]);

  // Read-only views show nothing for an empty field (matches published page)
  if (readOnly && !value) return null;

  const baseStyle: CSSProperties = variant === "eyebrow" ? PUB_EYEBROW_STYLE : PUB_SUBTITLE_STYLE;

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      readOnly={readOnly}
      onChange={(e) => onChange(e.target.value.replace(/\n/g, ""))}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.preventDefault();
      }}
      placeholder={placeholder}
      aria-label={variant === "eyebrow" ? "Page eyebrow" : "Page subtitle"}
      className="block w-full resize-none overflow-hidden bg-transparent border-none outline-none focus-visible:ring-0 placeholder:text-current placeholder:opacity-35"
      style={{
        ...baseStyle,
        caretColor: "var(--pub-accent, currentColor)",
      }}
    />
  );
}
