"use client";

import { useState, useEffect, useCallback } from "react";

/** Single source of truth for the app-chrome theme contract. The pre-paint
 *  bootstrap script in src/app/layout.tsx mirrors this key/class/attribute —
 *  change them together. The buyer page + editor doc canvas theme
 *  independently (data-page-theme) and must NOT read this key. */
export const APP_THEME_STORAGE_KEY = "sr-ds-theme";

export type AppTheme = "light" | "dark";

function applyTheme(theme: AppTheme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.setAttribute("data-theme", theme);
}

/**
 * App-chrome light/dark theme state, persisted to localStorage and applied as
 * the `.dark` class + `data-theme` attribute on <html>. Used by the AppShell
 * rail and the standalone ThemeToggle (auth/404) so the mechanism lives once.
 */
export function useAppTheme() {
  const [theme, setTheme] = useState<AppTheme>("light");

  useEffect(() => {
    const stored = localStorage.getItem(APP_THEME_STORAGE_KEY) as AppTheme | null;
    if (stored === "dark" || stored === "light") setTheme(stored);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: AppTheme = prev === "dark" ? "light" : "dark";
      localStorage.setItem(APP_THEME_STORAGE_KEY, next);
      applyTheme(next);
      return next;
    });
  }, []);

  return { theme, toggle };
}
