/**
 * Page creation shared by POST /api/pages, POST /api/pages/from-template and
 * the MCP `create_page` tool. One place for the invariants every new page
 * must satisfy: a unique human-readable slug, the team's brand-kit styling,
 * and the plan caps (pages + tabs-per-page) enforced atomically under the
 * per-team advisory lock so concurrent creates can't race past a limit.
 */
import slugify from "slugify";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CONTENT, DEFAULT_TAB_NAME } from "@/lib/constants";
import { brandDefaultPageStyle, getTeamBrandKit } from "@/lib/brand-kit";
import { getUserTeamId } from "@/lib/team-auth";
import {
  assertCanCreatePageTx,
  assertCanCreateTabsTx,
  withResourceLock,
  pageLockKey,
} from "@/lib/plan-limits";

/** Thrown when five random suffixes all collided — practically never. */
export class SlugCollisionError extends Error {
  constructor() {
    super("Could not generate a unique URL. Please try a different title.");
    this.name = "SlugCollisionError";
  }
}

/** Template name → page title: "Template Name — Month D, YYYY". */
export function templatePageTitle(templateName: string, now = new Date()): string {
  return `${templateName} — ${now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;
}

export function generatePageSlug(title: string): string {
  const base = slugify(title, { lower: true, strict: true });
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

/** A slug that no page currently uses (retries the random suffix up to 5×). */
export async function uniquePageSlug(seed: string): Promise<string> {
  let slug = generatePageSlug(seed);
  let attempts = 0;
  while (attempts < 5) {
    const existing = await prisma.page.findUnique({ where: { slug } });
    if (!existing) return slug;
    slug = generatePageSlug(seed);
    attempts++;
  }
  throw new SlugCollisionError();
}

export interface NewTabInput {
  name: string;
  /** Tiptap doc JSON (already sanitized by the caller). */
  content: Record<string, unknown>;
}

export interface CreatePageInput {
  userId: string;
  /** The user's team when the caller already resolved it (skips a lookup). */
  teamId?: string | null;
  title: string;
  /** Seed for the slug; defaults to the title. */
  slugSeed?: string;
  /** Tabs in order; defaults to a single empty "Overview" tab. */
  tabs?: NewTabInput[];
  /** Optional deal to link on creation (caller must have verified access). */
  dealId?: string | null;
}

/**
 * Creates a page (+ its tabs) for `userId` in their team, applying the brand
 * kit and enforcing plan limits atomically. Throws PlanLimitError when a cap
 * is hit (withErrorHandler → 403 PLAN_LIMIT) and SlugCollisionError on the
 * vanishingly rare slug exhaustion.
 */
export async function createPageWithTabs(input: CreatePageInput) {
  const { userId, title } = input;
  const tabs: NewTabInput[] =
    input.tabs && input.tabs.length > 0
      ? input.tabs
      : [{ name: DEFAULT_TAB_NAME, content: DEFAULT_CONTENT }];

  const slug = await uniquePageSlug(input.slugSeed ?? title);
  const teamId = input.teamId !== undefined ? input.teamId : await getUserTeamId(userId);

  // New pages start from the team's brand kit (Settings → Branding), falling
  // back to the editorial baseline. Set explicitly because the DB column
  // defaults (inter/slate) predate the redesign.
  const style = brandDefaultPageStyle(await getTeamBrandKit(teamId));

  return withResourceLock(pageLockKey(teamId, userId), async (tx) => {
    await assertCanCreatePageTx(tx, teamId, userId);
    const created = await tx.page.create({
      data: {
        title,
        slug,
        // The first tab's content doubles as the page's top-level content
        // (legacy column; the published page renders tabs).
        content: JSON.stringify(tabs[0].content),
        userId,
        teamId,
        dealId: input.dealId ?? null,
        font: style.font,
        headingFont: style.headingFont,
        accentColor: style.accentColor,
        background: style.background,
        layoutWidth: style.layoutWidth,
        tabPlacement: style.tabPlacement,
        heroLayout: style.heroLayout,
        themeRadius: style.themeRadius,
        themeDepth: style.themeDepth,
        logoUrl: style.logoUrl,
      },
    });
    await assertCanCreateTabsTx(tx, created.id, teamId, tabs.length);
    await tx.tab.createMany({
      data: tabs.map((tab, i) => ({
        name: tab.name,
        order: i,
        content: JSON.stringify(tab.content),
        pageId: created.id,
      })),
    });
    return tx.page.findUniqueOrThrow({
      where: { id: created.id },
      include: { tabs: { orderBy: { order: "asc" } } },
    });
  });
}
