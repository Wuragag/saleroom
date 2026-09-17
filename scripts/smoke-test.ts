/**
 * Boots the production build and requests the buyer-facing pages.
 *
 * Why this exists: typecheck, lint, tests and `next build` all passed while
 * every /p/[slug] request 500'd in production (PR #18 -> #19). The failure was
 * in the webpack-bundled server output at module load, so it could only ever
 * surface on a real request — vitest imports the same source and stays green.
 * Nothing in CI issued a request. This does.
 *
 * Deliberately does not assert on a specific error: it catches any module-load
 * or render failure on the routes that matter, whatever the cause.
 *
 * Usage: `npm run smoke` after `npx next build`, against a local database
 * seeded by scripts/smoke-seed.ts.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { prisma } from "@/lib/prisma";
import { SMOKE_SLUG_PREFIX } from "./smoke-fixtures";

const PORT = Number(process.env.SMOKE_PORT ?? 3000);
const BASE = `http://127.0.0.1:${PORT}`;
const BOOT_TIMEOUT_MS = 90_000;

interface Failure {
  route: string;
  problem: string;
}

const failures: Failure[] = [];

function fail(route: string, problem: string) {
  failures.push({ route, problem });
  console.error(`  FAIL ${route} — ${problem}`);
}

async function waitForServer(): Promise<void> {
  const deadline = Date.now() + BOOT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/pricing`, { redirect: "manual" });
      if (res.status < 500) return;
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server did not become ready within ${BOOT_TIMEOUT_MS}ms`);
}

/** A published page must render, and render its blocks. */
async function checkPublishedPage(slug: string, themedSlugs: Set<string>) {
  const route = `/p/${slug}`;
  const res = await fetch(`${BASE}${route}`, { redirect: "manual" });
  if (res.status !== 200) {
    fail(route, `expected 200, got ${res.status}`);
    return;
  }
  const html = await res.text();
  if (html.includes("pub-block-missing")) {
    // renderPubHtml's fallback: the tab could not be serialized at all.
    fail(route, "rendered the pub-block-missing fallback — a block failed to serialize");
  }
  if (!html.includes("pub-content")) {
    fail(route, "response is missing the .pub-content wrapper");
  }
  if (html.includes("var(--pub-")) themedSlugs.add(slug);
}

/**
 * A route that 500s at module load does so for every request, including one
 * whose data does not exist — that asymmetry is what identified the outage.
 */
async function checkUnknownSlug() {
  const route = "/p/smoke-no-such-page";
  const res = await fetch(`${BASE}${route}`, { redirect: "manual" });
  if (res.status >= 500) {
    fail(route, `a slug with no row must not 500 (got ${res.status})`);
  }
}

async function checkControlRoute(route: string) {
  const res = await fetch(`${BASE}${route}`, { redirect: "manual" });
  if (res.status >= 500) fail(route, `expected non-5xx, got ${res.status}`);
}

async function main() {
  const pages = await prisma.page.findMany({
    where: { published: true, slug: { startsWith: SMOKE_SLUG_PREFIX } },
    select: { slug: true },
    orderBy: { slug: "asc" },
  });
  await prisma.$disconnect();

  if (pages.length === 0) {
    throw new Error(
      "No smoke fixtures found — run `npm run smoke:seed` against the same database."
    );
  }

  console.log(`Starting production server on :${PORT}...`);
  const server: ChildProcess = spawn(
    "npx",
    ["next", "start", "-p", String(PORT)],
    { stdio: ["ignore", "inherit", "inherit"], env: process.env }
  );

  let exitCode = 0;
  try {
    await waitForServer();
    console.log(`Checking ${pages.length} published page(s) + control routes...`);

    const themedSlugs = new Set<string>();
    for (const { slug } of pages) await checkPublishedPage(slug, themedSlugs);
    await checkUnknownSlug();
    for (const route of ["/", "/pricing"]) await checkControlRoute(route);

    // Guards the first-paint theming fix: custom blocks carry their colors as
    // var(--pub-*) inline styles in the *server* HTML, not after hydration.
    if (themedSlugs.size === 0) {
      fail("/p/*", "no page rendered a var(--pub-*) inline style server-side");
    }

    if (failures.length > 0) {
      console.error(`\n${failures.length} smoke check(s) failed.`);
      exitCode = 1;
    } else {
      console.log(`\nAll smoke checks passed (${pages.length} pages).`);
    }
  } catch (err) {
    console.error(err);
    exitCode = 1;
  } finally {
    server.kill("SIGTERM");
  }

  process.exit(exitCode);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
