/**
 * URL-hash anchors for a page's tabs, so a seller can deep-link one section
 * ("…/p/acme-renewal#pricing") and a buyer can share the tab they're on.
 * Pure; consumed by TabbedPageView.
 */

export function slugifyTabName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Tab id → unique anchor. Unnamed tabs fall back to "section-N"; duplicate
 * names get a numeric suffix so every tab stays addressable.
 */
export function buildTabAnchors(
  tabs: { id: string; name: string }[]
): Map<string, string> {
  const used = new Set<string>();
  const out = new Map<string, string>();
  tabs.forEach((tab, i) => {
    const base = slugifyTabName(tab.name) || `section-${i + 1}`;
    let anchor = base;
    let n = 2;
    while (used.has(anchor)) anchor = `${base}-${n++}`;
    used.add(anchor);
    out.set(tab.id, anchor);
  });
  return out;
}

/** Resolves a location hash (with or without the "#") to a tab id, or null. */
export function tabIdForHash(
  hash: string,
  anchors: Map<string, string>
): string | null {
  let wanted = hash.replace(/^#/, "");
  try {
    wanted = decodeURIComponent(wanted);
  } catch {
    /* keep the raw value */
  }
  wanted = wanted.trim().toLowerCase();
  if (!wanted) return null;
  for (const [id, anchor] of anchors) {
    if (anchor === wanted) return id;
  }
  return null;
}
