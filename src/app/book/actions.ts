"use server";

import { prisma } from "@/lib/db";
import { getAvailableSlots, isSlotBookable } from "@/lib/availability";
import { bookingSchema } from "@/lib/validators";

/** Return bookable start times (ISO strings) for a service on a given day. */
export async function getSlotsAction(
  serviceId: string,
  dateKey: string,
): Promise<{ slots: string[] }> {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || !service.active) return { slots: [] };
  const slots = await getAvailableSlots(dateKey, service.durationMinutes);
  return { slots: slots.map((s) => s.toISOString()) };
}

export type CreateBookingResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/** Validate, re-check availability, and persist a booking. */
export async function createBookingAction(
  raw: unknown,
): Promise<CreateBookingResult> {
  const parsed = bookingSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please check your details.",
    };
  }
  const data = parsed.data;

  const service = await prisma.service.findUnique({
    where: { id: data.serviceId },
  });
  if (!service || !service.active) {
    return { ok: false, error: "That service is no longer available." };
  }

  const start = new Date(data.startTime);
  if (Number.isNaN(start.getTime())) {
    return { ok: false, error: "That time is invalid. Please pick again." };
  }

  // Re-check right before writing to reduce the double-booking race window.
  const stillFree = await isSlotBookable(start, service.durationMinutes);
  if (!stillFree) {
    return {
      ok: false,
      error: "Sorry — that time was just booked. Please choose another slot.",
    };
  }

  const end = new Date(start.getTime() + service.durationMinutes * 60_000);

  const booking = await prisma.booking.create({
    data: {
      serviceId: service.id,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      notes: data.notes ?? "",
      startTime: start,
      endTime: end,
      status: "CONFIRMED",
    },
  });

  return { ok: true, id: booking.id };
}
