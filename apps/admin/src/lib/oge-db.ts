/**
 * A read-only connection to nexoris_oge, for reporting on the assistant's knowledge base.
 *
 * The admin already reaches into nexoris_cms for content, so a second cross-database read is not a
 * new pattern. It is deliberately narrow: the only thing read here is how many pages Oge knows and
 * when they were last refreshed, which the System tab reports. Everything Oge does with that data is
 * the gateway's business, and asking the gateway instead would mean losing the signal exactly when
 * the gateway is down, which is one of the times you most want to see it.
 */
import pg from "pg";

const { Pool } = pg;
let pool: pg.Pool | undefined;

export function ogeDb(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL_OGE;
    if (!connectionString) throw new Error("DATABASE_URL_OGE is not set.");
    pool = new Pool({
      connectionString,
      max: 2,
      min: 0,
      connectionTimeoutMillis: 8_000,
      statement_timeout: 15_000,
      query_timeout: 15_000,
    });
    pool.on("error", (err) => {
      console.error("[oge-db] idle client error:", err.message);
    });
  }
  return pool;
}
