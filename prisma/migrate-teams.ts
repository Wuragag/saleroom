/**
 * Data migration: Create a default team for each existing user
 * and assign all their pages to that team.
 *
 * Run: npx tsx prisma/migrate-teams.ts
 */
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, company: true },
  });

  console.log(`Found ${users.length} user(s) to migrate.`);

  for (const user of users) {
    // Check if user already has a team
    const existing = await prisma.teamMember.findFirst({
      where: { userId: user.id },
    });

    if (existing) {
      console.log(`  ✓ ${user.name} already has a team, skipping.`);
      continue;
    }

    const teamName = user.company
      ? user.company
      : `${user.name}'s Team`;

    const team = await prisma.team.create({
      data: {
        name: teamName,
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
    });

    // Assign all of this user's pages to the team
    const result = await prisma.page.updateMany({
      where: { userId: user.id, teamId: null },
      data: { teamId: team.id },
    });

    console.log(
      `  ✓ Created team "${teamName}" for ${user.name} — ${result.count} page(s) assigned.`
    );
  }

  console.log("\nMigration complete.");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
