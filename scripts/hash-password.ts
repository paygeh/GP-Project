// Generate a bcrypt hash for the admin password.
// Usage:  npm run hash -- "your-new-password"
import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error('Usage: npm run hash -- "your-new-password"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
// Next.js expands `$` in .env as variable references, which corrupts a bcrypt
// hash. Escape each `$` as `\$` so it's stored literally.
const escaped = hash.replace(/\$/g, "\\$");
console.log("\nAdd this to your .env (the $ are escaped for Next.js):\n");
console.log(`ADMIN_PASSWORD_HASH="${escaped}"\n`);
