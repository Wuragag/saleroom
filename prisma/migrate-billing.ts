import { PrismaClient } from "../src/generated/prisma";
import Stripe from "stripe";
import "dotenv/config";

const prisma = new PrismaClient();
const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function main() {
  // Find all teams that don't have a Subscription record yet
  const teams = await prisma.team.findMany({
    where: { subscription: null },
    include: {
      members: {
        where: { role: "OWNER" },
        include: { user: { select: { email: true, name: true, id: true } } },
        take: 1,
      },
    },
  });

  console.log(`Found ${teams.length} teams without subscriptions`);

  for (const team of teams) {
    const owner = team.members[0]?.user;
    if (!owner) {
      console.log(`⚠ Skipping team ${team.id} (${team.name}) — no owner found`);
      continue;
    }

    try {
      // Check if a Stripe customer already exists for this email
      const existing = await stripeClient.customers.list({
        email: owner.email,
        limit: 1,
      });

      let customerId: string;
      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
        // Update metadata on existing customer
        await stripeClient.customers.update(customerId, {
          metadata: { teamId: team.id, userId: owner.id },
        });
      } else {
        const customer = await stripeClient.customers.create({
          email: owner.email,
          name: owner.name,
          metadata: { teamId: team.id, userId: owner.id },
        });
        customerId = customer.id;
      }

      await prisma.subscription.create({
        data: {
          teamId: team.id,
          stripeCustomerId: customerId,
          plan: "FREE",
          status: "ACTIVE",
        },
      });

      console.log(`✓ Created FREE subscription for team "${team.name}" (${team.id})`);
    } catch (err) {
      console.error(`✗ Failed for team ${team.id}:`, err);
    }
  }

  console.log("\nMigration complete");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
