/**
 * robots.txt for the Nexoris Technologies platform (PRD 9.1).
 *
 * The site is open to crawlers. The sitemap index is advertised. Content pages that are not ready
 * are kept out of the index with a per-page noindex directive (PRD 9.9), not by disallowing them
 * here, so a page that becomes ready needs no robots.txt change.
 *
 * The paths below are the exception: they are not content at all. The API surface, the admin sign-in
 * screens and the invite and recovery links have nothing to offer a crawler and should never appear
 * in a result page. These rules were previously hand-written into apps/web/public/robots.txt while
 * this builder still emitted the permissive version, so regenerating the file silently dropped them.
 * They live here now so the generator and the committed file cannot disagree.
 */
import { SITE_ORIGIN } from "./constants.js";

/** Paths that are never content, and so are never worth crawling. */
export const DISALLOWED_PATHS = [
  "/api/",
  "/login",
  "/admin",
  "/accept-invite",
  "/forgot-password",
] as const;

/** Build the robots.txt content. */
export function buildRobotsTxt(): string {
  return [
    "User-agent: *",
    "Allow: /",
    "",
    "# Private and non-content paths: never index these.",
    ...DISALLOWED_PATHS.map((p) => `Disallow: ${p}`),
    "",
    `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
    "",
  ].join("\n");
}
