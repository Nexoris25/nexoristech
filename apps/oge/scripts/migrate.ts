/**
 * A small, transparent forward-only migration runner for nexoris_oge. It applies every
 * `.sql` file in apps/oge/migrations in filename order, inside a transaction, and records each
 * applied file in `_oge_migration` so re-running is a no-op. Plain SQL keeps pgvector DDL (the
 * vector type and HNSW indexes) first-class without an ORM. The connection string is read from
 * DATABASE_URL_OGE; no secret is hardcoded.
 *
 * Run with: pnpm --filter @nexoris/oge db:migrate
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const { Client } = pg;

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "..", "migrations");

/** Load the gitignored repo-root .env if it exists, so local runs need no extra setup. In
 * production DATABASE_URL_OGE is set in the environment directly and this is a harmless no-op. */
function loadLocalEnv(): void {
  try {
    process.loadEnvFile(join(here, "..", "..", "..", ".env"));
  } catch {
    // No .env on disk (for example in CI or production); rely on the real environment.
  }
}

function connectionString(): string {
  const url = process.env.DATABASE_URL_OGE;
  if (!url) {
    throw new Error(
      "DATABASE_URL_OGE is not set. Load it from the gitignored .env before migrating.",
    );
  }
  return url;
}

async function run(): Promise<void> {
  loadLocalEnv();
  const client = new Client({ connectionString: connectionString() });
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _oge_migration (
        name        text PRIMARY KEY,
        applied_at  timestamptz NOT NULL DEFAULT now()
      );
    `);

    const applied = new Set(
      (
        await client.query<{ name: string }>("SELECT name FROM _oge_migration")
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
        await client.query("INSERT INTO _oge_migration (name) VALUES ($1)", [
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
