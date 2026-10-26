import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Prices/durations are starting points — edit them in Admin → Services.
const SERVICES = [
  {
    name: "Haircut",
    description: "Consultation, cut, and a finished style.",
    durationMinutes: 45,
    priceCents: 4500,
    sortOrder: 1,
  },
  {
    name: "Braids",
    description: "Protective braiding styled just for you.",
    durationMinutes: 180,
    priceCents: 15000,
    sortOrder: 2,
  },
  {
    name: "Shampoo",
    description: "Cleanse and condition with a relaxing scalp massage.",
    durationMinutes: 30,
    priceCents: 2500,
    sortOrder: 3,
  },
  {
    name: "Blowout",
    description: "Smooth, voluminous blow-dry and style.",
    durationMinutes: 45,
    priceCents: 4500,
    sortOrder: 4,
  },
  {
    name: "Silk Press",
    description: "Sleek, smooth press for a flowing, polished finish.",
    durationMinutes: 90,
    priceCents: 7500,
    sortOrder: 5,
  },
];

// Working hours. dayOfWeek: 0=Sun..6=Sat ; minutes from midnight.
// Monday–Friday, 9am–6pm.
const RULES = [
  { dayOfWeek: 1, startMinutes: 9 * 60, endMinutes: 18 * 60 }, // Mon 9–6
  { dayOfWeek: 2, startMinutes: 9 * 60, endMinutes: 18 * 60 }, // Tue 9–6
  { dayOfWeek: 3, startMinutes: 9 * 60, endMinutes: 18 * 60 }, // Wed 9–6
  { dayOfWeek: 4, startMinutes: 9 * 60, endMinutes: 18 * 60 }, // Thu 9–6
  { dayOfWeek: 5, startMinutes: 9 * 60, endMinutes: 18 * 60 }, // Fri 9–6
];

async function main() {
  // Settings (idempotent).
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      businessName: "Imagine That Hair Experience with Lizzy",
      tagline: "Effortless booking for your next appointment",
      slotIntervalMins: 30,
      leadTimeMins: 120,
      maxDaysOut: 60,
    },
  });

  // Only seed services & hours if none exist, so reseeding won't duplicate or
  // clobber real data.
  if ((await prisma.service.count()) === 0) {
    await prisma.service.createMany({ data: SERVICES });
    console.log(`Seeded ${SERVICES.length} services.`);
  } else {
    console.log("Services already present — skipping.");
  }

  if ((await prisma.availabilityRule.count()) === 0) {
    await prisma.availabilityRule.createMany({ data: RULES });
    console.log(`Seeded ${RULES.length} availability rules.`);
  } else {
    console.log("Availability rules already present — skipping.");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
