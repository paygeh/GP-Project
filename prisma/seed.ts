import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SERVICES = [
  {
    name: "Women's Haircut & Style",
    description: "Consultation, shampoo, precision cut, and a finished style.",
    durationMinutes: 60,
    priceCents: 6500,
    sortOrder: 1,
  },
  {
    name: "Men's Haircut",
    description: "Clean, tailored cut with styling.",
    durationMinutes: 30,
    priceCents: 3500,
    sortOrder: 2,
  },
  {
    name: "Blowout & Style",
    description: "Shampoo and a smooth, voluminous blow-dry.",
    durationMinutes: 45,
    priceCents: 5000,
    sortOrder: 3,
  },
  {
    name: "Root Touch-Up Color",
    description: "Single-process color to refresh your roots.",
    durationMinutes: 90,
    priceCents: 9500,
    sortOrder: 4,
  },
  {
    name: "Balayage / Highlights",
    description: "Hand-painted, dimensional color with a gloss and style.",
    durationMinutes: 150,
    priceCents: 18000,
    sortOrder: 5,
  },
  {
    name: "Keratin Smoothing Treatment",
    description: "Frizz-reducing treatment for smoother, healthier hair.",
    durationMinutes: 120,
    priceCents: 16000,
    sortOrder: 6,
  },
  {
    name: "Special Occasion Updo",
    description: "An elegant updo for weddings, events, and photoshoots.",
    durationMinutes: 60,
    priceCents: 8500,
    sortOrder: 7,
  },
];

// Working hours. dayOfWeek: 0=Sun..6=Sat ; minutes from midnight.
const RULES = [
  { dayOfWeek: 2, startMinutes: 9 * 60, endMinutes: 19 * 60 }, // Tue 9–7
  { dayOfWeek: 3, startMinutes: 9 * 60, endMinutes: 19 * 60 }, // Wed 9–7
  { dayOfWeek: 4, startMinutes: 9 * 60, endMinutes: 19 * 60 }, // Thu 9–7
  { dayOfWeek: 5, startMinutes: 9 * 60, endMinutes: 19 * 60 }, // Fri 9–7
  { dayOfWeek: 6, startMinutes: 9 * 60, endMinutes: 16 * 60 }, // Sat 9–4
];

async function main() {
  // Settings (idempotent).
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      businessName: "Hair Studio",
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
