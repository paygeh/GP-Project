"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { createSession, destroySession } from "@/lib/session";
import { getAdminUser } from "@/lib/admin";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const admin = await getAdminUser();
  const adminEmail = admin.email.trim().toLowerCase();

  const ok =
    adminEmail.length > 0 &&
    admin.passwordHash.length > 0 &&
    email === adminEmail &&
    bcrypt.compareSync(password, admin.passwordHash);

  if (!ok) {
    return { error: "Invalid email or password." };
  }

  await createSession(admin.email);
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}
