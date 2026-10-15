// Generate a bcrypt hash for the admin password.
// Usage:  npm run hash -- "your-new-password"
import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error('Usage: npm run hash -- "your-new-password"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log("\nAdd this to your .env:\n");
console.log(`ADMIN_PASSWORD_HASH="${hash}"\n`);
