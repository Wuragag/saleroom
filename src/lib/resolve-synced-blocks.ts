import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TipTapNode = Record<string, any>;

/**
 * Walk a TipTap JSON tree, collect all syncedBlockIds, batch-fetch them,
 * and replace each syncedBlock node with the actual content.
 *
 * Only resolves one level deep — synced block content itself is never
 * scanned for nested synced blocks (prevents circular references).
 */
export async function resolveSyncedBlocks(doc: TipTapNode): Promise<TipTapNode> {
  if (!doc?.content) return doc;

  // 1. Collect all synced block IDs
  const ids = new Set<string>();
  for (const node of doc.content) {
    if (node.type === "syncedBlock" && node.attrs?.syncedBlockId) {
      ids.add(node.attrs.syncedBlockId);
    }
  }

  if (ids.size === 0) return doc;

  // 2. Batch fetch from DB
  const blocks = await prisma.syncedBlock.findMany({
    where: { id: { in: Array.from(ids) } },
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

  // 3. Replace synced block nodes with their content
  const newContent: TipTapNode[] = [];
  for (const node of doc.content) {
    if (node.type === "syncedBlock" && node.attrs?.syncedBlockId) {
      const resolved = blockMap.get(node.attrs.syncedBlockId);
      if (resolved?.content && Array.isArray(resolved.content)) {
        // Splice the block's inner content nodes into the document
        newContent.push(...resolved.content);
      }
      // If block was deleted or content is invalid, simply omit the node
    } else {
      newContent.push(node);
    }
  }

  return { ...doc, content: newContent };
}
