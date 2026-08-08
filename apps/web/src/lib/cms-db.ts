/**
 * Read-only connection to the custom CMS database (nexoris_cms). The website reads published content
 * straight from the CMS the admin writes to, so pages always reflect the latest editorial state. A single
 * pool is reused across requests. Queries degrade gracefully in cms.ts: any failure returns empty so a
 * page never breaks when the database is unavailable.
 */
import pg from "pg";

const { Pool } = pg;
let pool: pg.Pool | undefined;

export function cmsDb(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL_CMS;
    if (!connectionString) throw new Error("DATABASE_URL_CMS is not set.");
    pool = new Pool({ connectionString, max: 5, min: 0 });
  }
  return pool;
}

/** A URL-safe slug from a display name (authors have no stored slug in the CMS). */
export function nameSlug(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
