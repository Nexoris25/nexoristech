/**
 * The nexoris_cms connection pool. The CMS is a module of the admin platform but keeps its own
 * database (nexoris_cms), separate from nexoris_admin, so content and platform data never mix. A
 * single pool is reused across requests, mirroring lib/db.ts.
 */
import pg from "pg";

const { Pool } = pg;
let pool: pg.Pool | undefined;

export function cmsDb(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL_CMS;
    if (!connectionString) throw new Error("DATABASE_URL_CMS is not set.");
    pool = new Pool({
      connectionString,
      max: 5,
      min: 0,
      // Same reasoning as the admin pool: fail in seconds, not on the OS TCP timeout.
      connectionTimeoutMillis: 8_000,
      statement_timeout: 15_000,
      query_timeout: 15_000,
    });
    pool.on("error", (err) => {
      console.error("[cms-db] idle client error:", err.message);
    });
  }
  return pool;
}
