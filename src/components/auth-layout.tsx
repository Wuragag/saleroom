import Image from "next/image";

import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Split editorial auth shell shared by sign-in / sign-up: a full-bleed
 * engraving art panel (hidden < 860px) beside a bordered form panel with a
 * corner theme toggle and an uppercase eyebrow above the form content.
 */
export function AuthLayout({
  art,
  eyebrow,
  headline,
  children,
}: {
  art: string;
  eyebrow: string;
  headline: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Art panel */}
      <div className="relative hidden flex-[1.1] overflow-hidden bg-secondary md:block">
        <Image
          src={art}
          alt=""
          fill
          priority
          // Art panel is hidden below md — 1px there stops mobile from
          // preloading a full-width hero it never shows.
          sizes="(max-width: 767px) 1px, 60vw"
          className="hero-neg object-cover"
          style={{
            maskImage:
              "linear-gradient(to bottom left, black 20%, transparent 78%)",
            WebkitMaskImage:
              "linear-gradient(to bottom left, black 20%, transparent 78%)",
          }}
        />
        <div className="absolute left-10 top-10">
          <span className="font-display text-heading text-foreground">
            SalesRoom
          </span>
        </div>
        <p className="absolute bottom-12 left-10 max-w-sm font-display text-title leading-tight text-foreground">
          {headline}
        </p>
      </div>

      {/* Form panel */}
      <div className="relative flex w-full shrink-0 flex-col justify-center border-l border-border bg-card px-8 py-12 md:w-[460px]">
        <ThemeToggle className="absolute right-6 top-6" />
        <div className="mx-auto w-full max-w-sm">
          <p className="text-caption font-semibold uppercase text-muted-foreground">
            {eyebrow}
          </p>
          {children}
        </div>
      </div>
    </div>
  );
}
