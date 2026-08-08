/**
 * Google Analytics 4 (Data API) reader. Fetches real sessions/users and — the piece the PRD cares about
 * for GEO — referrals from AI assistants (ChatGPT, Perplexity, Gemini, Copilot, Claude…), which is the
 * closest measurable proxy for "AI citations": visits that arrive from an AI answer. Returns null when the
 * numeric property id or credentials are absent, so screens fall back to sample data.
 *
 * Note: GA4_PROPERTY_ID must be the NUMERIC property id (GA4 Admin > Property Settings), not the G- id.
 */
import { googleAccessToken } from "./auth.js";

const API = "https://analyticsdata.googleapis.com/v1beta/properties";

/**
 * Sources that mean the visit came out of an AI answer. Deliberately excludes plain "bing" and "google":
 * those are ordinary search engines, and counting them here would inflate AI visibility with traffic that
 * has nothing to do with an AI citation. Copilot is counted only under its own host.
 */
export const AI_HOSTS = [
  "chatgpt.com", "chat.openai.com", "openai.com",
  "perplexity.ai", "www.perplexity.ai",
  "gemini.google.com", "bard.google.com", "notebooklm.google.com",
  "copilot.microsoft.com", "claude.ai", "you.com", "phind.com", "poe.com",
];

export interface Ga4Referral { source: string; sessions: number }
export interface Ga4Totals { sessions: number; users: number; pageViews: number }

interface ReportRow { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }

async function runReport(body: Record<string, unknown>): Promise<ReportRow[] | null> {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId || !/^\d+$/.test(propertyId)) return null; // numeric property id required
  const token = await googleAccessToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API}/${propertyId}:runReport`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      // Credentials exist but the call failed: surface it instead of quietly showing sample data. The
      // usual causes are the Analytics Data API not being enabled on the Cloud project, or the account
      // lacking Viewer access on the GA4 property.
      console.warn(`[ga4] ${res.status} for property ${propertyId}: ${(await res.text()).slice(0, 200)}`);
      return null;
    }
    const json = (await res.json()) as { rows?: ReportRow[] };
    return Array.isArray(json.rows) ? json.rows : [];
  } catch (err) {
    console.warn(`[ga4] request failed: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

/**
 * Sessions, users and page views over the last `days` days. Null if unavailable.
 *
 * Page views are here because the CMS dashboard reported them from `cms_content.views`, a column the
 * seed data filled and nothing has ever incremented. Analytics is where a page view is actually counted.
 */
export async function fetchGa4Totals(days: number): Promise<Ga4Totals | null> {
  const rows = await runReport({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "screenPageViews" }],
  });
  if (!rows) return null;
  const m = rows[0]?.metricValues ?? [];
  return {
    sessions: Number(m[0]?.value ?? 0),
    users: Number(m[1]?.value ?? 0),
    pageViews: Number(m[2]?.value ?? 0),
  };
}

/** The most-viewed pages over the last `days` days, from Analytics rather than a stored counter. */
export interface Ga4TopPage { path: string; views: number }
export async function fetchGa4TopPages(days: number, limit = 5): Promise<Ga4TopPage[] | null> {
  const rows = await runReport({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "screenPageViews" }],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit,
  });
  if (!rows) return null;
  return rows
    .map((r) => ({ path: r.dimensionValues?.[0]?.value ?? "", views: Number(r.metricValues?.[0]?.value ?? 0) }))
    .filter((r) => r.path);
}

/** Sessions referred by AI assistants over the last `days` days, largest first. Null if unavailable. */
export async function fetchGa4AiReferrals(days: number): Promise<Ga4Referral[] | null> {
  const rows = await runReport({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "sessionSource" }],
    metrics: [{ name: "sessions" }],
    dimensionFilter: { filter: { fieldName: "sessionSource", inListFilter: { values: AI_HOSTS } } },
    limit: 25,
  });
  if (!rows) return null;
  return rows
    .map((r) => ({ source: r.dimensionValues?.[0]?.value ?? "", sessions: Number(r.metricValues?.[0]?.value ?? 0) }))
    .filter((r) => r.source)
    .sort((a, b) => b.sessions - a.sessions);
}

export interface Ga4AiLandingPage { path: string; sessions: number; source: string }

/**
 * The pages people actually land on when they arrive from an AI assistant, largest first.
 *
 * This is the honest version of a "top cited pages" report. Nobody publishes citation data, but a
 * landing page reached from chatgpt.com or perplexity.ai is direct evidence that the page was surfaced
 * in an answer. Grouped by landing page and source so the report can say which assistant sent them.
 */
export async function fetchGa4AiLandingPages(days: number, limit = 10): Promise<Ga4AiLandingPage[] | null> {
  const rows = await runReport({
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "landingPagePlusQueryString" }, { name: "sessionSource" }],
    metrics: [{ name: "sessions" }],
    dimensionFilter: { filter: { fieldName: "sessionSource", inListFilter: { values: AI_HOSTS } } },
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit,
  });
  if (!rows) return null;
  return rows
    .map((r) => ({
      path: r.dimensionValues?.[0]?.value ?? "",
      source: r.dimensionValues?.[1]?.value ?? "",
      sessions: Number(r.metricValues?.[0]?.value ?? 0),
    }))
    .filter((r) => r.path);
}
