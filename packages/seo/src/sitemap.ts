/**
 * Sitemap generation for the Nexoris Technologies platform.
 *
 * The XML sitemap is split into logical groups (PRD 9.1): core, services, industries, insights,
 * authors, careers, and programmatic. A sitemap index references each group. Only indexable
 * pages appear; a page set to noindex is dropped from its group in the same publish so the
 * sitemap and the robots directive never disagree (PRD 12.1). URLs use the absolute
 * trailing-slash form so they match the canonical exactly.
 */
import { SITE_ORIGIN } from "./constants.js";
import { absoluteUrl } from "./url.js";

/** The logical sitemap groups. */
export type SitemapGroup =
  | "core"
  | "services"
  | "industries"
  | "insights"
  | "authors"
  | "careers"
  | "programmatic";

export const SITEMAP_GROUPS: SitemapGroup[] = [
  "core",
  "services",
  "industries",
  "insights",
  "authors",
  "careers",
  "programmatic",
];

/** One entry in a sitemap. */
export interface SitemapEntry {
  /** The site path, for example "/about". */
  path: string;
  /** The last-modified date in ISO 8601, when known. */
  lastmod?: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Build a urlset XML document for one sitemap group. */
export function buildUrlset(entries: SitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      const loc = escapeXml(absoluteUrl(entry.path));
      const lastmod = entry.lastmod
        ? `\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`
        : "";
      return `  <url>\n    <loc>${loc}</loc>${lastmod}\n  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/** A reference to one sitemap group in the sitemap index. */
export interface SitemapReference {
  group: SitemapGroup;
  lastmod?: string;
}

/** The path a sitemap group is served at. */
export function sitemapGroupPath(group: SitemapGroup): string {
  return `/sitemap-${group}.xml`;
}

/** Build the sitemap index XML referencing each group. */
export function buildSitemapIndex(references: SitemapReference[]): string {
  const sitemaps = references
    .map((reference) => {
      const loc = escapeXml(
        `${SITE_ORIGIN}${sitemapGroupPath(reference.group)}`,
      );
      const lastmod = reference.lastmod
        ? `\n    <lastmod>${escapeXml(reference.lastmod)}</lastmod>`
        : "";
      return `  <sitemap>\n    <loc>${loc}</loc>${lastmod}\n  </sitemap>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps}\n</sitemapindex>\n`;
}
