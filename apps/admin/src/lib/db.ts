/**
 * The nexoris_admin connection pool for the dashboard. A single pool is reused across requests.
 * The pool holds no idle connections because the remote VPS closes them (DECISIONS D-013).
 */
import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | undefined;

export function db(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL_ADMIN;
    if (!connectionString) {
      throw new Error("DATABASE_URL_ADMIN is not set.");
    }
    pool = new Pool({ connectionString, max: 5, min: 0 });
  }
  return pool;
}
