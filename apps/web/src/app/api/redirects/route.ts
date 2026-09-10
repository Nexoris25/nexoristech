/**
 * The live redirect rules, for the middleware.
 *
 * Middleware runs on the edge runtime and cannot open a Postgres connection, so it cannot read
 * cms_redirect directly. It used to fetch `${CMS_CONTENT_API_URL}/redirects` — the Strapi content API,
 * which no longer exists. That endpoint has been dead since Strapi was removed, so every CMS-managed
 * redirect on the site silently did nothing: the fetch failed, the catch swallowed it, and the
 * request carried on unredirected.
 *
 * This route runs on Node, reads the CMS database the rest of the site reads, and hands the middleware
 * the whole rule — type, match pattern, case and slash handling — rather than a bare source and
 * destination. Those settings have been on the CMS form all along with nothing behind them.
 *
 * Cached for ten seconds. It was sixty, and the middleware then cached the result for sixty more, so a
 * redirect could take two minutes to start working — long enough that anyone testing one immediately
 * after saving it concluded the feature was broken.
 */
import { cmsDb } from "../../../lib/cms-db.js";
import { isLive, type MatchPattern, type RedirectRule, type RedirectType } from "../../../lib/redirect-match.js";

export const runtime = "nodejs";
export const revalidate = 10;

interface Row {
  id: string;
  old_url: string;
  new_url: string | null;
  type: string;
  pattern: string;
  case_sensitivity: string;
  slash_handling: string;
  expiry_date: string | null;
  start_date: string | null;
}

export async function GET(): Promise<Response> {
  try {
    const { rows } = await cmsDb().query<Row>(
      `SELECT id, old_url, new_url, type, pattern, case_sensitivity, slash_handling,
              expiry_date::text AS expiry_date, start_date::text AS start_date
         FROM cms_redirect
        WHERE status = 'Active' AND old_url IS NOT NULL
        ORDER BY created_at
        LIMIT 500`,
    );

    const redirects: RedirectRule[] = rows
      .map((r) => ({
        id: r.id,
        source: r.old_url.trim(),
        destination: (r.new_url ?? "").trim(),
        type: (["301", "302", "307", "410"].includes(r.type) ? r.type : "301") as RedirectType,
        pattern: (r.pattern === "Pattern match (RegEx)" ? r.pattern : "Exact match") as MatchPattern,
        caseSensitive: r.case_sensitivity === "Match Case",
        exactSlash: r.slash_handling === "Exact Match",
        expiryDate: r.expiry_date,
        startDate: r.start_date,
      }))
      .filter((r) => {
        if (!r.source) return false;
        // A 410 says the page is gone and needs no destination; everything else needs somewhere to go.
        if (r.type !== "410" && !r.destination) return false;
        // A redirect to itself is an infinite loop. One shipped in the old seed data, so this is not
        // hypothetical: refuse them here rather than letting the middleware serve one.
        if (r.type !== "410" && r.pattern === "Exact match" && r.source === r.destination) return false;
        return isLive(r);
      })
      .map(({ expiryDate: _expiryDate, startDate: _startDate, ...rule }) => rule);

    return Response.json({ redirects });
  } catch (error) {
    console.error("[redirects] could not be read:", error instanceof Error ? error.message : error);
    // An empty list, not an error: a database blip must not stop the site serving pages.
    return Response.json({ redirects: [] as RedirectRule[] });
  }
}
