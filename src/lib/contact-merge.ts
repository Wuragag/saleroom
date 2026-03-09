import { prisma } from "@/lib/prisma";

/**
 * Link a BuyerVisitor to a PageContact (idempotent).
 * Uses first-attribution: won't overwrite an existing contactId.
 */
export async function mergeVisitorToContact(
  visitorHash: string,
  pageId: string,
  contactId: string
): Promise<void> {
  await prisma.buyerVisitor.updateMany({
    where: {
      visitorHash,
      pageId,
      contactId: null, // first attribution wins
    },
    data: { contactId },
  });
}
