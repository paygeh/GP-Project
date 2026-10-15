// Verify the auth primitives (run: npx tsx scripts/verify-auth.ts)
// Importing the db module triggers Prisma's .env loading, so AUTH_SECRET and
// ADMIN_PASSWORD_HASH are available in process.env.
import "@/lib/db";
import bcrypt from "bcryptjs";
import { signToken, verifyToken } from "@/lib/session-core";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error("FAIL: " + msg);
  console.log("  ✓ " + msg);
}

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "").toLowerCase();
  const hash = process.env.ADMIN_PASSWORD_HASH ?? "";
  assert(email && hash, "admin env vars present");

  // Password hashing round-trip (default dev password).
  assert(bcrypt.compareSync("salon2026", hash), "correct password matches hash");
  assert(!bcrypt.compareSync("wrong-pw", hash), "wrong password is rejected");

  // Session token round-trip.
  const token = await signToken(email);
  const payload = await verifyToken(token);
  assert(payload?.role === "admin", "signed token verifies with admin role");
  assert(payload?.email === email, "token carries the admin email");

  // Tampered / empty tokens rejected.
  assert((await verifyToken(undefined)) === null, "missing token rejected");
  assert((await verifyToken(token + "x")) === null, "tampered token rejected");

  console.log("\nAuth checks passed ✅\n");
}

main().catch((e) => {
  console.error("\n" + e.message + "\n");
  process.exit(1);
});
