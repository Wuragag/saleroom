import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { APP_NAME } from "@/lib/constants";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Minimal top bar */}
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="font-display text-heading text-foreground">
          {APP_NAME}
        </Link>
        <ThemeToggle />
      </header>

      {/* Center */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        <div className="relative mb-8 h-52 w-52 overflow-hidden rounded-2xl border border-border bg-secondary">
          <Image
            src="/redesign/hero-astronaut.jpg"
            alt=""
            fill
            sizes="208px"
            className="hero-neg object-cover"
          />
        </div>

        <p className="font-display text-hero text-foreground">404</p>
        <h1 className="mt-3 font-display text-title text-foreground">
          This page drifted away
        </h1>
        <p className="mt-2 max-w-md text-body text-muted-foreground">
          The link may be broken, or the page may have been unpublished or moved
          to another workspace.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          <Button asChild>
            <Link href="/dashboard">Back to your pages</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/analytics">Open analytics</Link>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-between px-6 py-5 text-2xs text-tertiary">
        <span>Error 404 · Page not found</span>
        <span>Powered by {APP_NAME}</span>
      </footer>
    </div>
  );
}
