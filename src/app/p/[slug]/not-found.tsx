import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

/**
 * Buyer-facing 404 for share links. A visitor lands here when a page was
 * unpublished, deleted, or its slug changed (slugs regenerate when the title
 * changes). They usually aren't a Dealbeam user, so no dashboard/analytics
 * CTAs — just what happened and what to do about it.
 */
export default function PublishedPageNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="text-2xs font-medium uppercase tracking-[0.14em] text-tertiary">
        Link unavailable
      </p>
      <h1 className="mt-3 font-display text-title text-foreground">
        This page isn&apos;t available
      </h1>
      <p className="mt-3 max-w-md text-body text-muted-foreground">
        It may have been unpublished or moved, or the link has changed. Ask the
        person who shared it with you for a fresh link.
      </p>
      <Link
        href="/?utm_source=powered_by&utm_medium=shared_page_404"
        className="mt-10 text-2xs font-medium uppercase tracking-[0.08em] text-tertiary transition-colors hover:text-foreground"
      >
        Powered by {APP_NAME}
      </Link>
    </main>
  );
}
