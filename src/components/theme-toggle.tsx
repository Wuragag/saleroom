"use client";

import { Sun, Moon } from "lucide-react";

import { useAppTheme } from "@/hooks/use-app-theme";
import { IconButton } from "@/components/ui/icon-button";

/**
 * Standalone light/dark toggle for surfaces outside the app shell (auth, 404).
 * Shares the theme mechanism with AppShell via useAppTheme.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useAppTheme();
  return (
    <IconButton
      variant="outline"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light" : "Switch to dark"}
      className={className}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </IconButton>
  );
}
