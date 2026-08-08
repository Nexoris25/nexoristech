/**
 * Google Search Console (Search Analytics API) reader. Fetches real clicks, impressions, CTR, and average
 * position for the configured property. Returns null when the property or credentials are absent so the
 * dashboard falls back to its sample series. Read-only; the property URL comes from GSC_PROPERTY.
 */
import { googleAccessToken } from "./auth.js";

const API = "https://searchconsole.googleapis.com/webmasters/v3/sites";

export interface GscDaily { date: string; clicks: number; impressions: number; ctr: number; position: number }
export interface GscRow { key: string; clicks: number; impressions: number; ctr: number; position: number }

interface ApiRow { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }
const iso = (d: Date): string => d.toISOString().slice(0, 10);

/**
 * Search Console treats https://example.com/ and https://www.example.com/ as different properties, and a
 * domain property is a third form again. Configuration should not have to care: from whatever is set we
 * derive every equivalent form and use the first one this account can actually read, caching the winner.
 */
function propertyCandidates(configured: string): string[] {
  const raw = configured.trim();
  if (raw.startsWith("sc-domain:")) return [raw];
  let host: string;
  try { host = new URL(raw).host; } catch { return [raw]; }
  const bare = host.replace(/^www\./, "");
  const scheme = raw.startsWith("http://") ? "http" : "https";
  return Array.from(new Set([
    raw.endsWith("/") ? raw : `${raw}/`,
    `${scheme}://www.${bare}/`,
    `${scheme}://${bare}/`,
    `sc-domain:${bare}`,
  ]));
}

let resolvedProperty: string | null = null;

async function query(body: Record<string, unknown>): Promise<ApiRow[] | null> {
  const configured = process.env.GSC_PROPERTY;
  if (!configured) return null;
  const token = await googleAccessToken();
  if (!token) return null;

  const candidates = resolvedProperty ? [resolvedProperty] : propertyCandidates(configured);
  let lastError = "";
  for (const property of candidates) {
    try {
      const res = await fetch(`${API}/${encodeURIComponent(property)}/searchAnalytics/query`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        if (resolvedProperty !== property) {
          resolvedProperty = property;
          if (property !== configured) console.warn(`[gsc] using property ${property} (configured as ${configured})`);
        }
        const json = (await res.json()) as { rows?: ApiRow[] };
        return Array.isArray(json.rows) ? json.rows : [];
      }
      lastError = `${res.status} ${(await res.text()).slice(0, 160)}`;
      // 403/404 means "not this form of the property"; keep trying the equivalents.
      if (res.status !== 403 && res.status !== 404) break;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      break;
    }
  }
  // Credentials exist but nothing worked: say so rather than quietly showing sample data.
  console.warn(`[gsc] no accessible property among ${candidates.join(", ")} — last error: ${lastError}`);
  resolvedProperty = null;
  return null;
}

/**
 * The most recent `days` days that Search Console has actually reported, oldest first.
 *
 * Google finalises a day's figures two to three days later, so asking for "the last day" by date
 * returns nothing — the window has not been published yet. That is why a literal 24-hour view was
 * always empty. This looks back far enough to find real days and returns the freshest ones, so the
 * shortest window shows the newest figures that exist rather than a blank chart.
 *
 * The caller is expected to show the dates, because "the last 24 hours" of reported data is usually
 * a day or two ago and saying otherwise would misdate it.
 */
export async function fetchGscLatestDays(days: number, filter?: GscFilter): Promise<GscDaily[] | null> {
  // Look back a fortnight to be safely clear of the reporting lag, then keep the newest days.
  const all = await fetchGscDaily(Math.max(14, days + 7), filter);
  if (all === null) return null;
  return all.slice(-days);
}

/**
 * A narrowing applied to every Search Console request.
 *
 * `country` is an ISO-3166-1 alpha-3 code, lowercase, which is what the API returns and expects
 * ("nga", not "NG"). `page` is matched by substring so a section can be selected with a path prefix
 * rather than needing the full URL.
 */
export interface GscFilter {
  country?: string | undefined;
  page?: string | undefined;
}

/** Translate a filter into the API's dimensionFilterGroups, or nothing when it is empty. */
function filterGroups(filter?: GscFilter): Record<string, unknown> {
  const filters: { dimension: string; operator: string; expression: string }[] = [];
  if (filter?.country) {
    filters.push({ dimension: "country", operator: "equals", expression: filter.country.toLowerCase() });
  }
  if (filter?.page) {
    filters.push({ dimension: "page", operator: "contains", expression: filter.page });
  }
  return filters.length ? { dimensionFilterGroups: [{ filters }] } : {};
}

/** Daily clicks/impressions/ctr/position for the last `days` days, oldest first. Null if unavailable. */
export async function fetchGscDaily(days: number, filter?: GscFilter): Promise<GscDaily[] | null> {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  const rows = await query({
    startDate: iso(start), endDate: iso(end), dimensions: ["date"], rowLimit: 1000,
    ...filterGroups(filter),
  });
  if (!rows) return null;
  return rows
    .map((r) => ({
      date: r.keys?.[0] ?? "",
      clicks: Number(r.clicks ?? 0),
      impressions: Number(r.impressions ?? 0),
      ctr: Number(r.ctr ?? 0) * 100,
      position: Number(r.position ?? 0),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Search Console rows grouped by a dimension (query, page, country, device, searchAppearance) over the
 * last `days` days, ordered by clicks. Null if unavailable.
 */
export async function fetchGscByDimension(
  dimension: "query" | "page" | "country" | "device" | "searchAppearance",
  days: number,
  limit = 10,
  filter?: GscFilter,
): Promise<GscRow[] | null> {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  const rows = await query({
    startDate: iso(start), endDate: iso(end), dimensions: [dimension], rowLimit: limit,
    ...filterGroups(filter),
  });
  if (!rows) return null;
  return rows.map((r) => ({
    key: r.keys?.[0] ?? "",
    clicks: Number(r.clicks ?? 0),
    impressions: Number(r.impressions ?? 0),
    ctr: Number(r.ctr ?? 0) * 100,
    position: Number(r.position ?? 0),
  }));
}

/** Top search queries by clicks over the last `days` days. Null if unavailable. */
export async function fetchGscTopQueries(days: number, limit = 10): Promise<GscRow[] | null> {
  return fetchGscByDimension("query", days, limit);
}

/**
 * How the site's results were presented in Search: rich results, and Google's AI surfaces.
 *
 * The AI Visibility screen used to state that Google exposed no API dimension for AI Overviews. That is
 * not true: `searchAppearance` is a queryable dimension of the Search Analytics API, and Google adds
 * appearance types to it as it ships them. It was never asked. Today the property returns no rows at
 * all, which is a real answer — no rich result or AI surface has been recorded — and the screen now
 * says that rather than asserting the data cannot exist.
 *
 * Returns null when Search Console is unreachable, and an empty array when it answers with nothing.
 */
export async function fetchGscSearchAppearance(days: number): Promise<GscRow[] | null> {
  return fetchGscByDimension("searchAppearance", days, 50);
}

/** Whether an appearance type is one of Google's AI surfaces, by its own naming. */
export function isAiAppearance(key: string): boolean {
  return /\bai[_\s-]?(overview|mode)\b|generative|\bsge\b/i.test(key);
}

/** Turn Google's SHOUTING_SNAKE appearance keys into something readable. */
export function appearanceLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bAi\b/g, "AI")
    .replace(/\bAmp\b/g, "AMP")
    .replace(/\bFaq\b/g, "FAQ");
}

/**
 * How many distinct pages Google has actually served in search results over the window.
 *
 * A page cannot receive an impression unless Google has indexed it, so this is a real indexed count
 * rather than a count of what we have published. It is a floor, not the whole index: a page indexed but
 * never shown in the window will not appear. The dashboard says so rather than implying completeness.
 *
 * The authoritative per-URL answer is the URL Inspection API, which is quota-limited to a couple of
 * thousand calls a day and would have to be run as a crawl job. That is a separate piece of work.
 */
export async function fetchGscIndexedPageCount(days: number): Promise<number | null> {
  // 25,000 is the API's per-request row ceiling, which is far above the size of this site.
  const rows = await fetchGscByDimension("page", days, 25000);
  if (rows === null) return null;
  return new Set(rows.map((r) => r.key)).size;
}
