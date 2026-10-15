import { z } from "zod";

export const bookingSchema = z.object({
  serviceId: z.string().min(1, "Please choose a service."),
  startTime: z.string().datetime({ message: "Invalid time." }),
  customerName: z.string().trim().min(1, "Please enter your name.").max(120),
  customerEmail: z.string().trim().email("Please enter a valid email."),
  customerPhone: z
    .string()
    .trim()
    .min(7, "Please enter a valid phone number.")
    .max(30),
  notes: z.string().trim().max(500).optional().default(""),
});

export type BookingInput = z.infer<typeof bookingSchema>;

export const serviceSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  description: z.string().trim().max(500).optional().default(""),
  durationMinutes: z.coerce.number().int().min(5).max(600),
  priceCents: z.coerce.number().int().min(0).max(1_000_000),
  active: z.coerce.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().min(0).max(1000).optional().default(0),
});

export const availabilityRuleSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startMinutes: z.coerce.number().int().min(0).max(1440),
  endMinutes: z.coerce.number().int().min(0).max(1440),
  active: z.coerce.boolean().optional().default(true),
});

export const timeOffSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
  reason: z.string().trim().max(200).optional().default(""),
});

export const settingsSchema = z.object({
  businessName: z.string().trim().min(1).max(120),
  tagline: z.string().trim().max(200).optional().default(""),
  slotIntervalMins: z.coerce.number().int().min(5).max(120),
  leadTimeMins: z.coerce.number().int().min(0).max(10_080),
  maxDaysOut: z.coerce.number().int().min(1).max(365),
});
