/**
 * Forward-only migration runner for nexoris_admin (the CRM). Applies every .sql file in
 * apps/admin/migrations in order, inside a transaction, recording each in _admin_migration so
 * re-running is a no-op. Reads DATABASE_URL_ADMIN from the gitignored repo-root .env.
 *
 * Run with: pnpm --filter @nexoris/admin db:migrate
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const { Client } = pg;
const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "..", "migrations");

function loadLocalEnv(): void {
  try {
    process.loadEnvFile(join(here, "..", "..", "..", ".env"));
  } catch {
    // No .env on disk; rely on the real environment.
  }
}

async function run(): Promise<void> {
  loadLocalEnv();
  const connectionString = process.env.DATABASE_URL_ADMIN;
  if (!connectionString) {
    throw new Error("DATABASE_URL_ADMIN is not set.");
  }
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _admin_migration (
        name        text PRIMARY KEY,
        applied_at  timestamptz NOT NULL DEFAULT now()
      );
    `);
    const applied = new Set(
      (
        await client.query<{ name: string }>(
          "SELECT name FROM _admin_migration",
        )
      ).rows.map((r) => r.name),
    );
    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`skip   ${file} (already applied)`);
        continue;
      }
      const sql = readFileSync(join(migrationsDir, file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO _admin_migration (name) VALUES ($1)", [
          file,
        ]);
        await client.query("COMMIT");
        console.log(`apply  ${file}`);
        count += 1;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
    console.log(
      count === 0 ? "Up to date; nothing to apply." : `Applied ${count}.`,
    );
  } finally {
    await client.end();
  }
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
