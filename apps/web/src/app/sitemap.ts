/**
 * The XML sitemap for the Nexoris Technologies marketing site, served at /sitemap.xml (PRD 9.1).
 * Lists every indexable hardcoded page plus the published CMS-driven URLs: Insights, authors,
 * careers, the legal pages, and the programmatic permutation pages, so the whole crawlable surface
 * is discoverable. URLs use the absolute trailing-slash form to match the canonicals. The CMS
 * fetches degrade gracefully to nothing if the content API is unavailable at build.
 */
import type { MetadataRoute } from "next";
import { absoluteUrl } from "@nexoris/seo";
import { allHardcodedPages } from "../content/index.js";
import {
  getAuthorSlugs,
  getDiscoveryEntries,
} from "../lib/cms.js";
import { authorPath } from "../lib/routes.js";

const LEGAL = ["/privacy-policy", "/terms-of-service", "/cookie-policy"];
export const revalidate = 300;

function entries(
  paths: string[],
  changeFrequency: "weekly" | "monthly",
  priority: number,
): MetadataRoute.Sitemap {
  return paths.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency,
    priority,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const hardcoded: MetadataRoute.Sitemap = allHardcodedPages.map((page) => ({
    url: new URL(absoluteUrl(page.meta.slug)).href,
    changeFrequency: "monthly",
    priority: page.meta.slug === "/" ? 1 : 0.7,
  }));

  const [authors, content] = await Promise.all([
    getAuthorSlugs(),
    getDiscoveryEntries(),
  ]);

  const result: MetadataRoute.Sitemap = [
    ...hardcoded,
    ...entries(["/insights", "/careers", "/oge"], "weekly", 0.6),
    ...entries(LEGAL, "monthly", 0.3),
    ...entries(
      authors.map((s) => authorPath(s)),
      "monthly",
      0.4,
    ),
    ...content.map(entry => ({ url: absoluteUrl(entry.path), ...(entry.updatedAt ? { lastModified: entry.updatedAt } : {}) })),
  ];
  // The routing layer gives built-in pages precedence over generated pages and author slugs.
  const unique = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const entry of result) if (!unique.has(entry.url)) unique.set(entry.url, entry);
  return [...unique.values()];
}
