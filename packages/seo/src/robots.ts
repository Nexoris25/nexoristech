/**
 * robots.txt for the Nexoris Technologies platform (PRD 9.1).
 *
 * The site is open to crawlers. The sitemap index and the machine-readable llms.txt are
 * advertised. Individual unready pages are kept out of the index with a per-page noindex
 * directive (PRD 9.9), not by disallowing them here, so a page that becomes ready needs no
 * robots.txt change.
 */
import { SITE_ORIGIN } from "./constants.js";

/** Build the robots.txt content. */
export function buildRobotsTxt(): string {
  return [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
    "",
  ].join("\n");
}
