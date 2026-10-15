"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import {
  serviceSchema,
  availabilityRuleSchema,
  settingsSchema,
} from "@/lib/validators";

function refreshAll() {
  revalidatePath("/admin");
  revalidatePath("/admin/appointments");
  revalidatePath("/admin/services");
  revalidatePath("/admin/availability");
  revalidatePath("/");
  revalidatePath("/book");
}

/* ─────────────── Bookings ─────────────── */
export async function updateBookingStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["PENDING", "CONFIRMED", "CANCELLED"].includes(status)) return;
  await prisma.booking.update({ where: { id }, data: { status } });
  refreshAll();
}

/* ─────────────── Services ─────────────── */
function parseServiceForm(formData: FormData) {
  const priceDollars = Number(formData.get("price") ?? 0);
  return serviceSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    durationMinutes: formData.get("durationMinutes"),
    priceCents: Math.round(priceDollars * 100),
    active: formData.get("active") === "on" || formData.get("active") === "true",
    sortOrder: formData.get("sortOrder") ?? 0,
  });
}

export async function createServiceAction(formData: FormData) {
  await requireAdmin();
  const data = parseServiceForm(formData);
  await prisma.service.create({ data });
  refreshAll();
}

export async function updateServiceAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const data = parseServiceForm(formData);
  await prisma.service.update({ where: { id }, data });
  refreshAll();
}

/** Delete if unused; otherwise archive (keep history, hide from booking). */
export async function deleteServiceAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const count = await prisma.booking.count({ where: { serviceId: id } });
  if (count > 0) {
    await prisma.service.update({ where: { id }, data: { active: false } });
  } else {
    await prisma.service.delete({ where: { id } });
  }
  refreshAll();
}

export async function toggleServiceAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (!id) return;
  await prisma.service.update({ where: { id }, data: { active } });
  refreshAll();
}

/* ─────────────── Availability (one shift per day) ─────────────── */
function hhmmToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export async function saveDayHoursAction(formData: FormData) {
  await requireAdmin();
  const dayOfWeek = Number(formData.get("dayOfWeek"));
  const open = formData.get("open") === "on" || formData.get("open") === "true";

  // Replace any existing rules for that day.
  await prisma.availabilityRule.deleteMany({ where: { dayOfWeek } });

  if (open) {
    const startMinutes = hhmmToMinutes(String(formData.get("start") ?? "09:00"));
    const endMinutes = hhmmToMinutes(String(formData.get("end") ?? "17:00"));
    const parsed = availabilityRuleSchema.parse({
      dayOfWeek,
      startMinutes,
      endMinutes,
      active: true,
    });
    if (parsed.endMinutes > parsed.startMinutes) {
      await prisma.availabilityRule.create({ data: parsed });
    }
  }
  refreshAll();
}

/* ─────────────── Time off ─────────────── */
export async function addTimeOffAction(formData: FormData) {
  await requireAdmin();
  const start = new Date(String(formData.get("start") ?? ""));
  const end = new Date(String(formData.get("end") ?? ""));
  const reason = String(formData.get("reason") ?? "").slice(0, 200);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
  if (end <= start) return;
  await prisma.timeOff.create({ data: { start, end, reason } });
  refreshAll();
}

export async function deleteTimeOffAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.timeOff.delete({ where: { id } });
  refreshAll();
}

/* ─────────────── Settings ─────────────── */
export async function updateSettingsAction(formData: FormData) {
  await requireAdmin();
  const data = settingsSchema.parse({
    businessName: formData.get("businessName"),
    tagline: formData.get("tagline") ?? "",
    slotIntervalMins: formData.get("slotIntervalMins"),
    leadTimeMins: formData.get("leadTimeMins"),
    maxDaysOut: formData.get("maxDaysOut"),
  });
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });
  refreshAll();
}
