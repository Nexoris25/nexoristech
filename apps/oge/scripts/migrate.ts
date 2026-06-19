/**
 * A small, transparent forward-only migration runner. It applies every `.sql` file in a target's
 * migrations directory in filename order, inside a transaction, and records each applied file in
 * `_oge_migration` so re-running is a no-op. Plain SQL keeps pgvector DDL first-class without an
 * ORM. The connection string is read from the environment; no secret is hardcoded.
 *
 * Targets (first CLI argument, defaults to "oge"):
 *   oge   -> DATABASE_URL_OGE,   apps/oge/migrations         (knowledge base, caches)
 *   admin -> DATABASE_URL_ADMIN, apps/oge/migrations-admin   (the CRM lead store, until Stage 9)
 *
 * Run with: pnpm --filter @nexoris/oge db:migrate         (oge)
 *           pnpm --filter @nexoris/oge db:migrate:admin   (admin)
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const { Client } = pg;

const here = dirname(fileURLToPath(import.meta.url));

const TARGETS = {
  oge: { envVar: "DATABASE_URL_OGE", dir: "migrations" },
  admin: { envVar: "DATABASE_URL_ADMIN", dir: "migrations-admin" },
} as const;

type Target = keyof typeof TARGETS;

function resolveTarget(): { envVar: string; dir: string } {
  const arg = process.argv[2] ?? "oge";
  if (!(arg in TARGETS)) {
    throw new Error(`Unknown migrate target "${arg}". Use oge or admin.`);
  }
  return TARGETS[arg as Target];
}

/** Load the gitignored repo-root .env if it exists, so local runs need no extra setup. In
 * production the connection string is set in the environment directly and this is a harmless no-op. */
function loadLocalEnv(): void {
  try {
    process.loadEnvFile(join(here, "..", "..", "..", ".env"));
  } catch {
    // No .env on disk (for example in CI or production); rely on the real environment.
  }
}

async function run(): Promise<void> {
  loadLocalEnv();
  const target = resolveTarget();
  const url = process.env[target.envVar];
  if (!url) {
    throw new Error(
      `${target.envVar} is not set. Load it from the gitignored .env before migrating.`,
    );
  }
  const migrationsDir = join(here, "..", target.dir);
  const client = new Client({ connectionString: url });
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
