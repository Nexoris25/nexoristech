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
import { ogeDb } from "./oge-db.js";
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

/** How long a knowledge base may go unrefreshed before it is worth saying so. */
const KB_STALE_DAYS = 30;

/**
 * How current Oge's knowledge of the website is.
 *
 * This exists because it went wrong quietly for two months. Publishing anything in the CMS re-ingests
 * automatically, so the content an editor touches stays current and everyone reasonably assumes the
 * rest does too. The hardcoded pages, which is where the company address, the services and how we
 * work all live, are only ingested when someone runs kb:export and kb:ingest by hand.
 *
 * Nobody did, so when the office address was corrected on the site, Oge carried on giving visitors
 * the older, longer version it had learned in June. It was not inventing anything, which is what made
 * it hard to spot: the answer was confident, well-formed, and faithfully quoted a source that had
 * stopped being true.
 *
 * Reported as a service rather than buried in the info list because "is what Oge tells people still
 * what the website says" is an operational question, and the answer is a date.
 */
async function checkKnowledgeBase(): Promise<ServiceCheck> {
  const name = "Oge knowledge base";
  const url = process.env.DATABASE_URL_OGE;
  if (!url) return { name, health: "not-configured", detail: "DATABASE_URL_OGE is not set" };
  try {
    const { rows } = await ogeDb().query<{ chunks: string; days: string | null }>(
      `SELECT count(*)::text chunks,
              extract(day from now() - max(updated_at))::int::text days
         FROM kb_chunk`,
    );
    const chunks = Number(rows[0]?.chunks ?? 0);
    const days = rows[0]?.days === null ? null : Number(rows[0]?.days ?? 0);
    if (chunks === 0) return { name, health: "down", detail: "no pages ingested" };
    const age = days === null ? "unknown age" : days === 0 ? "refreshed today" : `refreshed ${days} day${days === 1 ? "" : "s"} ago`;
    return days !== null && days > KB_STALE_DAYS
      ? { name, health: "down", detail: `${chunks} pages, ${age}. Run kb:export then kb:ingest.` }
      : { name, health: "up", detail: `${chunks} pages, ${age}` };
  } catch (e) {
    return { name, health: "unknown", detail: e instanceof Error ? e.message.slice(0, 80) : "could not be read" };
  }
}

export async function systemStatus(): Promise<{ services: ServiceCheck[]; info: SystemInfo[] }> {
  const [adminDb, contentDb, oge, queue, kb] = await Promise.all([
    checkPostgres(db, "Admin database"),
    checkPostgres(cmsDb, "Content database"),
    checkOge(),
    checkFiscalQueue(),
    checkKnowledgeBase(),
  ]);
  const services = [adminDb, contentDb, oge, kb, checkStorage(), queue, checkGoogle()];

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
