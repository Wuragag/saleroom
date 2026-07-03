"use client";

import { useLayoutEffect, useRef } from "react";
import { PUB_TITLE_STYLE } from "@/components/page-shell";

interface EditableTitleProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

/**
 * The page title, editable directly on the canvas but styled exactly like
 * the published h1.pub-title so what you type is what visitors see.
 */
export function EditableTitle({ value, onChange, readOnly }: EditableTitleProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow to fit content (single line by default, wraps like the h1).
  // Height depends on wrapping, which depends on width — so re-measure
  // whenever the textarea's width changes (initial layout, font load,
  // window/pane resizes), not just when the value changes.
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
      // Our own height writes retrigger the observer — only re-measure
      // when the WIDTH actually changed.
      if (el.clientWidth !== lastWidth) {
        lastWidth = el.clientWidth;
        measure();
      }
    });
    observer.observe(el);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => observer.disconnect();
  }, [value]);

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
      placeholder="Untitled Page"
      aria-label="Page title"
      className="block w-full resize-none overflow-hidden bg-transparent border-none outline-none focus-visible:ring-0 placeholder:text-current placeholder:opacity-40"
      style={{
        ...PUB_TITLE_STYLE,
        // placeholder inherits color; caret follows heading color
        caretColor: "var(--pub-accent, currentColor)",
      }}
    />
  );
}
