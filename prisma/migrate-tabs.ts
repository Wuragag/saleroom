import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find all pages that don't have any tabs yet
  const pages = await prisma.page.findMany({
    include: { tabs: true },
  });

  let migrated = 0;
  for (const page of pages) {
    if (page.tabs.length === 0) {
      await prisma.tab.create({
        data: {
          name: "Overview",
          order: 0,
          content: page.content || '{"type":"doc","content":[{"type":"paragraph"}]}',
          pageId: page.id,
        },
      });
      migrated++;
    }
  }

  console.log(`Migrated ${migrated} pages to have default tabs.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
