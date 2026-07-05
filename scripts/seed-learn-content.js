#!/usr/bin/env node

/**
 * Seed a starter course + lessons for the /learn module.
 * There's no admin UI yet — this is the fastest way to get real content in place.
 * Safe to re-run: skips seeding if any course already exists.
 *
 * Usage: node scripts/seed-learn-content.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const existingCount = await prisma.course.count();
  if (existingCount > 0) {
    console.log(
      `Found ${existingCount} existing course(s) — skipping seed. Delete them first (or use Prisma Studio) if you want to reseed.`
    );
    return;
  }

  const course = await prisma.course.create({
    data: {
      title: "Trading Fundamentals",
      description: "The essentials every trader should nail down before risking real money.",
      order: 0,
      lessons: {
        create: [
          {
            title: "Why You Need a Trading Journal",
            order: 0,
            body: "A trading journal turns gut-feel trading into a repeatable process. Every trade you log is a data point — over time those data points reveal your real edge (or lack of one), the setups that actually work for you, and the mistakes you keep repeating without noticing.\n\nStart simple: log the symbol, entry/exit, size, and your reasoning at the time. Review weekly, not just after big losses.",
          },
          {
            title: "Position Sizing 101",
            order: 1,
            body: "Position sizing is the single biggest lever you control. A great setup with oversized risk can still wipe you out; a mediocre setup with disciplined sizing rarely will.\n\nA common starting rule: risk no more than 1-2% of your account on any single trade. Calculate size from your stop-loss distance, not from how confident you feel.",
          },
          {
            title: "Reading Win Rate vs. Risk:Reward",
            order: 2,
            body: "Win rate alone tells you almost nothing. A 30% win rate can be highly profitable with a 3:1 reward-to-risk ratio; a 70% win rate can still lose money if losers are left to run.\n\nUse this app's Analytics page to track both numbers together, not in isolation.",
          },
        ],
      },
    },
    include: { lessons: true },
  });

  console.log(`Seeded course "${course.title}" with ${course.lessons.length} lessons.`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
