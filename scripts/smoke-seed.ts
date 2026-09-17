/**
 * Seeds published pages for the smoke test (scripts/smoke-test.ts).
 *
 * One page per shipped template, so every block type a template uses gets
 * server-rendered through pub-html.ts on a real request. Adding a template
 * therefore widens smoke coverage automatically — nothing to update here.
 *
 * Run `npx tsx prisma/seed.ts` first: this reads the templates it creates.
 */
import { prisma } from "@/lib/prisma";
import {
  SMOKE_SLUG_PREFIX,
  SMOKE_TEAM_ID,
  SMOKE_USER_ID,
} from "./smoke-fixtures";

/** Template tabs are stored as JSON: [{ label, content }]. */
interface TemplateTab {
  label: string;
  content: unknown;
}

/**
 * Seeding writes rows, so refuse anything that isn't an obviously local
 * database. A developer running this with the app's own .env loaded would
 * otherwise publish fixture pages into a real environment.
 */
function assertLocalDatabase(): void {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    throw new Error("DATABASE_URL is not a valid URL");
  }
  if (host !== "localhost" && host !== "127.0.0.1") {
    throw new Error(
      `Refusing to seed smoke fixtures into non-local database "${host}". ` +
        "Point DATABASE_URL at a disposable local Postgres."
    );
  }
}

function parseTabs(raw: string): TemplateTab[] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (t): t is TemplateTab =>
      !!t && typeof t === "object" && typeof (t as TemplateTab).label === "string"
  );
}

async function main() {
  assertLocalDatabase();

  await prisma.user.upsert({
    where: { id: SMOKE_USER_ID },
    update: {},
    create: { id: SMOKE_USER_ID, name: "Smoke User", email: "smoke@dealbeam.test" },
  });
  await prisma.team.upsert({
    where: { id: SMOKE_TEAM_ID },
    update: {},
    create: { id: SMOKE_TEAM_ID, name: "Smoke Team" },
  });
  await prisma.teamMember.upsert({
    where: { userId_teamId: { userId: SMOKE_USER_ID, teamId: SMOKE_TEAM_ID } },
    update: {},
    create: { userId: SMOKE_USER_ID, teamId: SMOKE_TEAM_ID, role: "OWNER" },
  });

  const templates = await prisma.template.findMany({ orderBy: { id: "asc" } });
  if (templates.length === 0) {
    throw new Error("No templates found — run `npx tsx prisma/seed.ts` first.");
  }

  for (const template of templates) {
    const tabs = parseTabs(template.tabs);
    if (tabs.length === 0) continue;

    const pageId = `${SMOKE_SLUG_PREFIX}page-${template.id}`;
    const slug = `${SMOKE_SLUG_PREFIX}${template.id}`;
    const common = {
      title: `Smoke — ${template.name}`,
      slug,
      published: true,
      userId: SMOKE_USER_ID,
      teamId: SMOKE_TEAM_ID,
      // Non-default styling so the rendered HTML carries the themed
      // var(--pub-*) inline styles the smoke test asserts on.
      accentColor: "#2f6df6",
      eyebrow: "Smoke fixture",
      subtitle: "Rendered by the CI smoke test.",
    };

    await prisma.page.upsert({
      where: { id: pageId },
      update: common,
      create: { id: pageId, ...common },
    });

    await prisma.tab.deleteMany({ where: { pageId } });
    await prisma.tab.createMany({
      data: tabs.map((tab, order) => ({
        pageId,
        name: tab.label,
        order,
        content: JSON.stringify(tab.content),
      })),
    });

    console.log(`Seeded smoke page /p/${slug} (${tabs.length} tab(s))`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
