/**
 * The nexoris_admin connection pool for the dashboard. A single pool is reused across requests.
 * The pool holds no idle connections because the remote VPS closes them (DECISIONS D-013).
 *
 * The timeouts matter as much as the connection string. Without connectionTimeoutMillis, an
 * unreachable database leaves every request hanging on the operating system's TCP timeout — about
 * twenty-one seconds of a blank screen before anything is reported. Failing in a few seconds turns an
 * outage into something a person can read and act on.
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
    pool = new Pool({
      connectionString,
      max: 5,
      min: 0,
      // Give up on an unreachable host quickly rather than hanging on the OS TCP timeout.
      connectionTimeoutMillis: 8_000,
      // A query that has stopped making progress should not hold a page open indefinitely.
      statement_timeout: 15_000,
      query_timeout: 15_000,
    });
    // A pool error with no listener terminates the process in Node. Log and let the next request
    // create a fresh connection.
    pool.on("error", (err) => {
      console.error("[db] idle client error:", err.message);
    });
  }
  return pool;
}
