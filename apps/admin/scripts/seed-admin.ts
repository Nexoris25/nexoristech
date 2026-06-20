/**
 * Create or update the first admin staff account from the environment, so the dashboard has an
 * initial sign-in. Idempotent on email. Never hardcodes credentials: it reads ADMIN_SEED_EMAIL,
 * ADMIN_SEED_PASSWORD, and optional ADMIN_SEED_NAME.
 *
 * Run with: ADMIN_SEED_EMAIL=... ADMIN_SEED_PASSWORD=... pnpm --filter @nexoris/admin db:seed:admin
 */
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import bcrypt from "bcryptjs";

const { Client } = pg;
const here = dirname(fileURLToPath(import.meta.url));

function loadLocalEnv(): void {
  try {
    process.loadEnvFile(join(here, "..", "..", "..", ".env"));
  } catch {
    // rely on the real environment
  }
}

async function run(): Promise<void> {
  loadLocalEnv();
  const email = (process.env.ADMIN_SEED_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD ?? "";
  const name = process.env.ADMIN_SEED_NAME ?? "Admin";
  if (!email || password.length < 8) {
    throw new Error(
      "Set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD (at least 8 characters).",
    );
  }
  const connectionString = process.env.DATABASE_URL_ADMIN;
  if (!connectionString) throw new Error("DATABASE_URL_ADMIN is not set.");

  const passwordHash = await bcrypt.hash(password, 10);
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(
      `INSERT INTO staff (name, email, password_hash, role, active)
       VALUES ($1, $2, $3, 'admin', true)
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         name = EXCLUDED.name,
         role = 'admin',
         active = true`,
      [name, email, passwordHash],
    );
    console.log(`Admin account ready for ${email}.`);
  } finally {
    await client.end();
  }
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
