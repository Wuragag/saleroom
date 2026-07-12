"use client";

import { useEffect } from "react";

/**
 * Scroll-triggered reveal enhancer for the buyer-facing page. Mounted once
 * (in the PageShell `trailing` slot on /p and /preview). Arms below-fold
 * blocks to fade in as they enter the viewport; if JS is unavailable the root
 * class is never added, so `.pub-content` children stay fully visible (the CSS
 * hide-then-reveal is gated on `.pub-reveal-on`). No-ops under reduced-motion.
 */
export function PubReveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    root.classList.add("pub-reveal-on");

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("pub-in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    const observeAll = () => {
      document
        .querySelectorAll(".pub-content > *:not(.pub-in)")
        .forEach((el) => io.observe(el));
    };
    observeAll();

    // Tab switches re-render .pub-content (keyed) — re-observe new children.
    const mo = new MutationObserver(observeAll);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      root.classList.remove("pub-reveal-on");
    };
  }, []);

  return null;
}
