import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TipTapNode = Record<string, any>;

/** Recursively collect every syncedBlockId in the tree. */
function collectIds(node: TipTapNode, ids: Set<string>): void {
  if (!Array.isArray(node?.content)) return;
  for (const child of node.content) {
    if (child.type === "syncedBlock" && child.attrs?.syncedBlockId) {
      ids.add(child.attrs.syncedBlockId);
    } else {
      collectIds(child, ids);
    }
  }
}

/**
 * Replace syncedBlock nodes with their resolved content, recursing into
 * container nodes (section/columns/column) so a synced block nested inside a
 * layout block still resolves. Resolved content is spliced in but never
 * re-scanned, so circular references can't loop.
 */
function replaceIn(node: TipTapNode, blockMap: Map<string, TipTapNode | null>): TipTapNode {
  if (!Array.isArray(node?.content)) return node;
  const newContent: TipTapNode[] = [];
  for (const child of node.content) {
    if (child.type === "syncedBlock" && child.attrs?.syncedBlockId) {
      const resolved = blockMap.get(child.attrs.syncedBlockId);
      if (resolved?.content && Array.isArray(resolved.content)) {
        newContent.push(...resolved.content);
      }
      // Deleted/invalid → omit the node
    } else {
      newContent.push(replaceIn(child, blockMap));
    }
  }
  return { ...node, content: newContent };
}

/**
 * Walk a TipTap JSON tree, collect all syncedBlockIds (at any depth),
 * batch-fetch them, and replace each syncedBlock node with the actual content.
 *
 * Only resolves one level deep — synced block content itself is never
 * scanned for nested synced blocks (prevents circular references).
 */
export async function resolveSyncedBlocks(doc: TipTapNode, teamId?: string | null): Promise<TipTapNode> {
  if (!doc?.content) return doc;

  // 1. Collect all synced block IDs (recursively — they can live inside a
  //    section or columns block, not just at the top level)
  const ids = new Set<string>();
  collectIds(doc, ids);

  if (ids.size === 0) return doc;

  // 2. Batch fetch from DB (scoped to team to prevent cross-team leakage)
  const blocks = await prisma.syncedBlock.findMany({
    where: { id: { in: Array.from(ids) }, ...(teamId ? { teamId } : {}) },
    select: { id: true, content: true },
  });
  const blockMap = new Map(
    blocks.map((b) => {
      try {
        return [b.id, JSON.parse(b.content)];
      } catch {
        return [b.id, null];
      }
    })
  );

  // 3. Replace synced block nodes with their content (recursively)
  return replaceIn(doc, blockMap);
}
