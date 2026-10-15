import { prisma } from "@/lib/db";
import { fromDateKey } from "@/lib/format";

/** Two half-open intervals [aStart, aEnd) and [bStart, bEnd) overlap? */
function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Combine a local date (midnight) with minutes-from-midnight into a Date. */
function atMinutes(day: Date, minutesOfDay: number): Date {
  const d = new Date(day);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(minutesOfDay);
  return d;
}

export type SlotContext = {
  settings: { slotIntervalMins: number; leadTimeMins: number; maxDaysOut: number };
  rules: { dayOfWeek: number; startMinutes: number; endMinutes: number }[];
  bookings: { startTime: Date; endTime: Date }[];
  timeOff: { start: Date; end: Date }[];
};

/**
 * Pure slot computation. Given a day, a service duration, the working-hour
 * rules, existing bookings and time-off, return the bookable start times.
 * Separated from DB access so it is easy to reason about and test.
 */
export function computeSlots(
  day: Date,
  durationMinutes: number,
  ctx: SlotContext,
  now: Date = new Date(),
): Date[] {
  const { slotIntervalMins, leadTimeMins } = ctx.settings;
  const dayOfWeek = day.getDay();
  const earliest = new Date(now.getTime() + leadTimeMins * 60_000);

  const todaysRules = ctx.rules.filter(
    (r) => r.dayOfWeek === dayOfWeek && r.endMinutes > r.startMinutes,
  );

  const slots: Date[] = [];
  const seen = new Set<number>();

  for (const rule of todaysRules) {
    for (
      let start = rule.startMinutes;
      start + durationMinutes <= rule.endMinutes;
      start += slotIntervalMins
    ) {
      const slotStart = atMinutes(day, start);
      const slotEnd = atMinutes(day, start + durationMinutes);

      // Not in the past / inside the lead-time window.
      if (slotStart < earliest) continue;

      // No overlap with an existing (non-cancelled) booking.
      const bookingClash = ctx.bookings.some((b) =>
        overlaps(slotStart, slotEnd, b.startTime, b.endTime),
      );
      if (bookingClash) continue;

      // No overlap with blocked time off.
      const timeOffClash = ctx.timeOff.some((t) =>
        overlaps(slotStart, slotEnd, t.start, t.end),
      );
      if (timeOffClash) continue;

      const key = slotStart.getTime();
      if (seen.has(key)) continue;
      seen.add(key);
      slots.push(slotStart);
    }
  }

  slots.sort((a, b) => a.getTime() - b.getTime());
  return slots;
}

/** Load the context for a given day and run the slot computation. */
export async function getAvailableSlots(
  dateKey: string,
  durationMinutes: number,
): Promise<Date[]> {
  const day = fromDateKey(dateKey);
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const [settings, rules, bookings, timeOff] = await Promise.all([
    getSettings(),
    prisma.availabilityRule.findMany({ where: { active: true } }),
    prisma.booking.findMany({
      where: {
        status: { not: "CANCELLED" },
        startTime: { lt: dayEnd },
        endTime: { gt: dayStart },
      },
      select: { startTime: true, endTime: true },
    }),
    prisma.timeOff.findMany({
      where: { start: { lt: dayEnd }, end: { gt: dayStart } },
      select: { start: true, end: true },
    }),
  ]);

  return computeSlots(day, durationMinutes, { settings, rules, bookings, timeOff });
}

/**
 * Server-side re-check used inside the booking transaction to guard against a
 * race where two customers grab the same slot. Returns true if the exact start
 * time is still bookable for the given duration.
 */
export async function isSlotBookable(
  start: Date,
  durationMinutes: number,
): Promise<boolean> {
  const day = new Date(start);
  day.setHours(0, 0, 0, 0);
  const minutesOfDay = start.getHours() * 60 + start.getMinutes();
  const slots = await getAvailableSlots(
    `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(
      day.getDate(),
    ).padStart(2, "0")}`,
    durationMinutes,
  );
  return slots.some(
    (s) => s.getHours() * 60 + s.getMinutes() === minutesOfDay,
  );
}

/** Fetch (and lazily create) the singleton settings row. */
export async function getSettings() {
  const existing = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (existing) return existing;
  return prisma.settings.create({ data: { id: "singleton" } });
}
