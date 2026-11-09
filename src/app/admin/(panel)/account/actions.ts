"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAdmin, createSession } from "@/lib/session";
import { getAdminUser } from "@/lib/admin";

export type AccountState = { error?: string; success?: string };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function updateAdminEmailAction(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  await requireAdmin();
  const newEmail = String(formData.get("newEmail") ?? "").trim();
  const currentPassword = String(formData.get("currentPassword") ?? "");

  const admin = await getAdminUser();
  if (!bcrypt.compareSync(currentPassword, admin.passwordHash)) {
    return { error: "Current password is incorrect." };
  }
  if (!EMAIL_RE.test(newEmail)) {
    return { error: "Please enter a valid email address." };
  }

  await prisma.adminUser.update({
    where: { id: "admin" },
    data: { email: newEmail },
  });
  // Refresh the session so the header shows the new email.
  await createSession(newEmail);
  return { success: "Login email updated." };
}

export async function updateAdminPasswordAction(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  await requireAdmin();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const admin = await getAdminUser();
  if (!bcrypt.compareSync(currentPassword, admin.passwordHash)) {
    return { error: "Current password is incorrect." };
  }
  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New passwords don't match." };
  }

  await prisma.adminUser.update({
    where: { id: "admin" },
    data: { passwordHash: bcrypt.hashSync(newPassword, 10) },
  });
  return { success: "Password updated." };
}
