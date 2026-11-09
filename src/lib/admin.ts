import "server-only";
import { prisma } from "@/lib/db";

/**
 * The single admin account. On first call it seeds the row from the
 * ADMIN_EMAIL / ADMIN_PASSWORD_HASH env vars, then the database is the source
 * of truth (editable from the Account page). After seeding, changing those env
 * vars no longer affects login.
 */
export async function getAdminUser() {
  let admin = await prisma.adminUser.findUnique({ where: { id: "admin" } });
  if (!admin) {
    admin = await prisma.adminUser.create({
      data: {
        id: "admin",
        email: (process.env.ADMIN_EMAIL ?? "").trim(),
        passwordHash: process.env.ADMIN_PASSWORD_HASH ?? "",
      },
    });
  }
  return admin;
}
