import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserTeamId, requireTeamOwner } from "@/lib/team-auth";
import { withErrorHandler, safeJson } from "@/lib/api-error";
import { canHideBranding } from "@/lib/plan-limits";
import {
  getTeamBrandKit,
  isValidBackgroundKey,
  isValidDepthKey,
  isValidFontKey,
  isValidHex,
  isValidRadiusKey,
  MAX_SECONDARY_COLORS,
  type BrandKitData,
} from "@/lib/brand-kit";
import { DEFAULT_PAGE_STYLE } from "@/lib/page-styles";

const DEFAULT_KIT: BrandKitData = {
  primaryColor: DEFAULT_PAGE_STYLE.accentColor,
  secondaryColors: [],
  logoUrl: "",
  font: DEFAULT_PAGE_STYLE.font,
  headingFont: "",
  background: DEFAULT_PAGE_STYLE.background,
  themeRadius: "default",
  themeDepth: "default",
  hideBranding: false,
};

/** Brand kit for the caller's team (defaults when not configured). */
export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = await getUserTeamId(session.user.id);
  if (!teamId) {
    return NextResponse.json({
      kit: DEFAULT_KIT,
      configured: false,
      isOwner: false,
      hideBrandingAllowed: false,
    });
  }

  const [kit, hideCheck, ownership] = await Promise.all([
    getTeamBrandKit(teamId),
    canHideBranding(teamId),
    prisma.teamMember.findFirst({
      where: { teamId, userId: session.user.id, role: "OWNER" },
      select: { id: true },
    }),
  ]);

  return NextResponse.json({
    kit: kit ?? DEFAULT_KIT,
    configured: !!kit,
    isOwner: !!ownership,
    hideBrandingAllowed: hideCheck.allowed,
  });
});

/** Update the team brand kit (owner only). */
export const PATCH = withErrorHandler(async (request: Request) => {
  const owner = await requireTeamOwner();
  if (!owner.authorized || !owner.teamId) {
    return NextResponse.json(
      { error: owner.reason ?? "Not a team owner" },
      { status: owner.session ? 403 : 401 }
    );
  }
  const teamId = owner.teamId;

  const body = await safeJson<Partial<BrandKitData>>(request);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (body.primaryColor !== undefined) {
    if (!isValidHex(body.primaryColor)) {
      return NextResponse.json({ error: "primaryColor must be a #rrggbb hex" }, { status: 400 });
    }
    data.primaryColor = body.primaryColor.toLowerCase();
  }
  if (body.secondaryColors !== undefined) {
    if (
      !Array.isArray(body.secondaryColors) ||
      body.secondaryColors.length > MAX_SECONDARY_COLORS ||
      !body.secondaryColors.every(isValidHex)
    ) {
      return NextResponse.json(
        { error: `secondaryColors must be up to ${MAX_SECONDARY_COLORS} #rrggbb hex values` },
        { status: 400 }
      );
    }
    data.secondaryColors = JSON.stringify(body.secondaryColors.map((c) => c.toLowerCase()));
  }
  if (body.font !== undefined) {
    if (!isValidFontKey(body.font) || body.font === "") {
      return NextResponse.json({ error: "Unknown font" }, { status: 400 });
    }
    data.font = body.font;
  }
  if (body.headingFont !== undefined) {
    if (!isValidFontKey(body.headingFont)) {
      return NextResponse.json({ error: "Unknown heading font" }, { status: 400 });
    }
    data.headingFont = body.headingFont;
  }
  if (body.background !== undefined) {
    if (!isValidBackgroundKey(body.background)) {
      return NextResponse.json({ error: "Unknown background" }, { status: 400 });
    }
    data.background = body.background;
  }
  if (body.themeRadius !== undefined) {
    if (!isValidRadiusKey(body.themeRadius)) {
      return NextResponse.json({ error: "Unknown corner style" }, { status: 400 });
    }
    data.themeRadius = body.themeRadius;
  }
  if (body.themeDepth !== undefined) {
    if (!isValidDepthKey(body.themeDepth)) {
      return NextResponse.json({ error: "Unknown depth style" }, { status: 400 });
    }
    data.themeDepth = body.themeDepth;
  }
  if (body.hideBranding !== undefined) {
    if (body.hideBranding) {
      const check = await canHideBranding(teamId);
      if (!check.allowed) {
        return NextResponse.json({ error: check.reason, code: "PLAN_LIMIT" }, { status: 403 });
      }
    }
    data.hideBranding = !!body.hideBranding;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await prisma.brandKit.upsert({
    where: { teamId },
    update: data,
    create: { teamId, ...data },
  });

  // Bust ISR for the team's published pages so hide-branding (the one kit
  // field that affects already-published pages) propagates promptly.
  if (data.hideBranding !== undefined) {
    const pages = await prisma.page.findMany({
      where: { teamId, published: true },
      select: { slug: true },
    });
    for (const p of pages) revalidatePath(`/p/${p.slug}`);
  }

  const kit = await getTeamBrandKit(teamId);
  return NextResponse.json({ kit, configured: true });
});
