/**
 * The enabled redirects, for the middleware.
 *
 * Middleware runs on the edge runtime and cannot open a Postgres connection, so it cannot read
 * cms_redirect directly. It used to fetch `${CMS_CONTENT_API_URL}/redirects` — the Strapi content API,
 * which no longer exists. That endpoint has been dead since Strapi was removed, so every CMS-managed
 * redirect on the site has silently done nothing: the fetch failed, the catch swallowed it, and the
 * request carried on unredirected.
 *
 * This route runs on Node, reads the CMS database the rest of the site reads, and hands the middleware
 * a plain list. It is deliberately small and cacheable: the middleware caches the result for a minute,
 * so this is hit roughly once per minute per instance rather than once per request.
 */
import { cmsDb } from "../../../lib/cms-db.js";

export const runtime = "nodejs";
export const revalidate = 60;

export interface RedirectRow {
  source: string;
  destination: string;
  permanent: boolean;
}

export async function GET(): Promise<Response> {
  try {
    const { rows } = await cmsDb().query<{ old_url: string; new_url: string; type: string }>(
      `SELECT old_url, new_url, type
         FROM cms_redirect
        WHERE status = 'Active' AND old_url IS NOT NULL AND new_url IS NOT NULL
        LIMIT 500`,
    );

    const redirects: RedirectRow[] = rows
      .map((r) => ({
        source: r.old_url.trim(),
        destination: r.new_url.trim(),
        // Anything not explicitly temporary is permanent, which matches how the CMS presents it.
        permanent: String(r.type) !== "302",
      }))
      // A redirect to itself is an infinite loop. One shipped in the old seed data, so this is not
      // hypothetical: refuse them here rather than letting the middleware serve one.
      .filter((r) => r.source && r.destination && r.source !== r.destination);

    return Response.json({ redirects });
  } catch (error) {
    console.error("[redirects] could not be read:", error instanceof Error ? error.message : error);
    // An empty list, not an error: a database blip must not stop the site serving pages.
    return Response.json({ redirects: [] as RedirectRow[] });
  }
}
