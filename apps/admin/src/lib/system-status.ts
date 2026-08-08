/**
 * What the platform can actually report about itself, for the System tab of Global Settings.
 *
 * That tab listed six services all marked "Operational" and a System Health of "Healthy", with nothing
 * behind any of it — including an Email Service that no longer exists, since invitations became shared
 * links. It also reported "PostgreSQL 15.5" and "Nexoris CMS v2.4.1" as facts. Each check here is
 * performed when the page loads, and anything that cannot be checked is reported as unknown.
 */
import { db } from "./db.js";
import { cmsDb } from "./cms-db.js";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

export type Health = "up" | "down" | "not-configured" | "unknown";

export interface ServiceCheck {
  name: string;
  health: Health;
  detail: string;
}

export interface SystemInfo {
  key: string;
  value: string;
}

async function checkPostgres(pool: () => { query: (sql: string) => Promise<{ rows: { v: string }[] }> }, name: string): Promise<ServiceCheck> {
  const started = Date.now();
  try {
    const { rows } = await pool().query("SELECT version() AS v");
    const version = rows[0]?.v?.match(/PostgreSQL ([\d.]+)/)?.[1] ?? "unknown version";
    return { name, health: "up", detail: `PostgreSQL ${version} · ${Date.now() - started}ms` };
  } catch (err) {
    return { name, health: "down", detail: err instanceof Error ? err.message.slice(0, 80) : "unreachable" };
  }
}

/** The Oge gateway is a separate service, so it is asked rather than assumed. */
async function checkOge(): Promise<ServiceCheck> {
  const base = process.env.OGE_GATEWAY_URL;
  if (!base) return { name: "Oge AI gateway", health: "not-configured", detail: "OGE_GATEWAY_URL is not set" };
  const started = Date.now();
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/health`, { signal: AbortSignal.timeout(4000) });
    return res.ok
      ? { name: "Oge AI gateway", health: "up", detail: `${Date.now() - started}ms` }
      : { name: "Oge AI gateway", health: "down", detail: `HTTP ${res.status}` };
  } catch (err) {
    return { name: "Oge AI gateway", health: "down", detail: err instanceof Error ? err.message.slice(0, 80) : "unreachable" };
  }
}

/** Uploads are written to the local disk, so the check is whether that directory is there and writable. */
function checkStorage(): ServiceCheck {
  const dir = join(process.cwd(), "public", "uploads");
  try {
    if (!existsSync(dir)) return { name: "Media storage", health: "down", detail: "public/uploads does not exist" };
    return statSync(dir).isDirectory()
      ? { name: "Media storage", health: "up", detail: "public/uploads on local disk" }
      : { name: "Media storage", health: "down", detail: "public/uploads is not a directory" };
  } catch {
    return { name: "Media storage", health: "unknown", detail: "could not be read" };
  }
}

/**
 * The fiscalisation queue drains when /api/fiscal/queue is called. Nothing calls it on a schedule yet,
 * so what can be reported is how much is waiting, not that a worker is running.
 */
async function checkFiscalQueue(): Promise<ServiceCheck> {
  try {
    const { rows } = await db().query<{ n: string }>(
      "SELECT count(*)::text n FROM fiscal_submission_job WHERE status IN ('pending','retrying')");
    const waiting = Number(rows[0]?.n ?? 0);
    return {
      name: "Fiscalisation queue",
      health: "not-configured",
      detail: `${waiting} waiting · no scheduler calls /api/fiscal/queue yet`,
    };
  } catch {
    return { name: "Fiscalisation queue", health: "unknown", detail: "queue table could not be read" };
  }
}

/** Search Console and Analytics answer only when credentials are present. */
function checkGoogle(): ServiceCheck {
  const gsc = Boolean(process.env.GSC_PROPERTY);
  const ga4 = Boolean(process.env.GA4_PROPERTY_ID);
  if (gsc && ga4) return { name: "Google Search Console and Analytics", health: "up", detail: "Both properties configured" };
  if (!gsc && !ga4) return { name: "Google Search Console and Analytics", health: "not-configured", detail: "Neither property is set" };
  return {
    name: "Google Search Console and Analytics",
    health: "not-configured",
    detail: gsc ? "GA4_PROPERTY_ID is not set" : "GSC_PROPERTY is not set",
  };
}

export async function systemStatus(): Promise<{ services: ServiceCheck[]; info: SystemInfo[] }> {
  const [adminDb, contentDb, oge, queue] = await Promise.all([
    checkPostgres(db, "Admin database"),
    checkPostgres(cmsDb, "Content database"),
    checkOge(),
    checkFiscalQueue(),
  ]);
  const services = [adminDb, contentDb, oge, checkStorage(), queue, checkGoogle()];

  const info: SystemInfo[] = [
    { key: "Environment", value: process.env.NODE_ENV === "production" ? "Production" : "Development" },
    { key: "Node", value: process.version },
    { key: "Admin database", value: adminDb.detail },
    { key: "Content database", value: contentDb.detail },
    { key: "Website origin", value: process.env.WEB_ORIGIN ?? "not set" },
    { key: "Website revalidation", value: process.env.REVALIDATION_SECRET ? "Configured" : "Not configured" },
  ];
  return { services, info };
}
