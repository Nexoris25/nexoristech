/**
 * Forward-only migration runner for nexoris_cms. Applies every .sql file in apps/admin/migrations-cms
 * in order, inside a transaction, recording each in _cms_migration so re-running is a no-op.
 *
 * The CMS migrations had no runner of their own — each one was applied by hand, which is fine exactly
 * once and then stops being fine: there was no record of what had run, so the only way to know whether
 * a column existed was to look. Takes DATABASE_URL_CMS from the environment (see loadLocalEnv).
 *
 * Run with: pnpm --filter @nexoris/admin db:migrate:cms
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const { Client } = pg;
const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "..", "migrations-cms");

/**
 * Resolve the connection the same way a deployment does.
 *
 * Precedence, strongest first: real environment variables, then the repo-root .env, then the app's
 * .env.local. In production only the first exists and nothing here reads a file at all, which is the
 * point: the runner must target whatever the deployment hands it.
 *
 * The root .env is the shared truth and holds the VPS connection, so it is loaded before .env.local.
 * process.loadEnvFile never overwrites a value already in process.env, so first loaded wins.
 */
function loadLocalEnv(): void {
  for (const file of [join(here, "..", "..", "..", ".env"), join(here, "..", ".env.local")]) {
    try {
      process.loadEnvFile(file);
    } catch {
      // Not on disk; try the next one, then fall back to the real environment.
    }
  }
}

/** The host and database a connection string points at, for printing. Never includes credentials. */
function describeTarget(connectionString: string): string {
  try {
    const u = new URL(connectionString);
    return `${u.hostname}:${u.port || "5432"}${u.pathname}`;
  } catch {
    return "an unparseable connection string";
  }
}


/**
 * Building a schema from nothing, on a host that is not this machine, is the one operation here that
 * can be catastrophically wrong — it is what happens when the connection string points somewhere
 * unintended. Applying migrations to an existing schema is routine; creating one from zero on a remote
 * database should be deliberate.
 *
 * This asks for --fresh in that single case. Everything else runs unchanged, so ordinary deployments
 * are untouched.
 */
function guardFreshRemoteBuild(connectionString: string, ledgerRows: number, schemaExists: boolean): void {
  const remote = !/localhost|127\.0\.0\.1|::1/.test(connectionString);
  const fromScratch = ledgerRows === 0 && !schemaExists;
  if (remote && fromScratch && !process.argv.includes("--fresh")) {
    throw new Error(
      `${describeTarget(connectionString)} has no schema and no migration history, so this run would ` +
      `build it from nothing. If that is intended, re-run with --fresh. If it is not, check which ` +
      `database the connection string points at before doing anything else.`,
    );
  }
}

async function run(): Promise<void> {
  loadLocalEnv();
  const connectionString = process.env.DATABASE_URL_CMS;
  if (!connectionString) {
    throw new Error("DATABASE_URL_CMS is not set.");
  }

  // Say which database is about to change, before changing it.
  console.log(`migrating ${describeTarget(connectionString)}`);

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _cms_migration (
        name text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    // The database already exists and was built by hand, so an empty ledger does not mean an empty
    // database. Re-running the early files would not just waste time: 0002 and 0004 insert seed content
    // that was deliberately deleted. On the first run against a live schema, everything up to and
    // including 0021 is recorded as done — it demonstrably is — and only later files actually run.
    const BOOTSTRAP_THROUGH = "0021_howto_schema_type.sql";
    const ledger = await client.query<{ n: string }>("SELECT count(*)::text AS n FROM _cms_migration");
    const live = await client.query<{ ok: boolean }>("SELECT to_regclass('public.cms_content') IS NOT NULL AS ok");
    guardFreshRemoteBuild(connectionString, Number(ledger.rows[0]?.n ?? 0), Boolean(live.rows[0]?.ok));
    if (ledger.rows[0]?.n === "0" && live.rows[0]?.ok) {
      const done = files.filter((f) => f <= BOOTSTRAP_THROUGH);
      for (const f of done) {
        await client.query("INSERT INTO _cms_migration (name) VALUES ($1) ON CONFLICT DO NOTHING", [f]);
      }
      console.log(`recorded ${done.length} already-applied migration(s).`);
    }

    const applied = new Set(
      (await client.query<{ name: string }>("SELECT name FROM _cms_migration")).rows.map((r) => r.name),
    );

    let ran = 0;
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = readFileSync(join(migrationsDir, file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO _cms_migration (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`applied ${file}`);
        ran += 1;
      } catch (e) {
        await client.query("ROLLBACK");
        throw new Error(`${file} failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    console.log(ran === 0 ? "nexoris_cms is up to date." : `nexoris_cms: ${ran} migration(s) applied.`);
  } finally {
    await client.end();
  }
}

run().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
