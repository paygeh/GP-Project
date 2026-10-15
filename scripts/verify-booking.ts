// End-to-end check of the booking engine (run: npx tsx scripts/verify-booking.ts)
import { prisma } from "@/lib/db";
import { getAvailableSlots, isSlotBookable } from "@/lib/availability";
import { createBookingAction } from "@/app/book/actions";
import { toDateKey } from "@/lib/format";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error("FAIL: " + msg);
  console.log("  ✓ " + msg);
}

async function main() {
  // Remove any leftover test bookings from a previous run.
  await prisma.booking.deleteMany({
    where: { customerEmail: { in: ["test@example.com", "second@example.com"] } },
  });

  const service = await prisma.service.findFirst({ where: { active: true } });
  assert(service, "found an active service");
  if (!service) return;
  console.log(`\nService: ${service.name} (${service.durationMinutes} min)`);

  // Find the next day with openings.
  let dateKey: string | null = null;
  let slots: Date[] = [];
  for (let offset = 1; offset <= 14; offset++) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const key = toDateKey(d);
    const s = await getAvailableSlots(key, service.durationMinutes);
    if (s.length > 0) {
      dateKey = key;
      slots = s;
      break;
    }
  }
  assert(dateKey, "found a day with open slots");
  console.log(`Date: ${dateKey} — ${slots.length} open slots`);

  const chosen = slots[0];
  const beforeCount = slots.length;

  // Create the booking through the real action.
  const res = await createBookingAction({
    serviceId: service.id,
    startTime: chosen.toISOString(),
    customerName: "Test Customer",
    customerEmail: "test@example.com",
    customerPhone: "555-0100",
    notes: "automated verification",
  });
  assert(res.ok, "createBookingAction succeeded");
  if (!res.ok) return;
  const bookingId = res.id;

  // The booked slot must now be gone. (A 60-min booking on a 30-min grid
  // removes more than one candidate start — overlapping starts are blocked.)
  const after = await getAvailableSlots(dateKey!, service.durationMinutes);
  assert(after.length < beforeCount, "slots were consumed by the booking");
  assert(
    !after.some((s) => s.getTime() === chosen.getTime()),
    "the exact booked time is no longer offered",
  );
  assert(
    (await isSlotBookable(chosen, service.durationMinutes)) === false,
    "isSlotBookable now returns false for that time",
  );

  // Double-booking is rejected.
  const dupe = await createBookingAction({
    serviceId: service.id,
    startTime: chosen.toISOString(),
    customerName: "Second Customer",
    customerEmail: "second@example.com",
    customerPhone: "555-0199",
    notes: "",
  });
  assert(!dupe.ok, "a second booking at the same time is rejected");

  // Persisted correctly.
  const saved = await prisma.booking.findUnique({ where: { id: bookingId } });
  assert(saved?.status === "CONFIRMED", "booking persisted as CONFIRMED");

  // Clean up so dev data stays tidy.
  await prisma.booking.delete({ where: { id: bookingId } });
  console.log("\nAll checks passed ✅  (test booking removed)\n");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("\n" + e.message + "\n");
    await prisma.$disconnect();
    process.exit(1);
  });
