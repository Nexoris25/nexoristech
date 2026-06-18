/**
 * The XML sitemap for the Nexoris Technologies marketing site, served at /sitemap.xml. Lists
 * every indexable hardcoded page (PRD 9.1). The split sitemap groups (insights, authors,
 * careers, programmatic) are added as those layers come online; this covers the 36 hardcoded
 * pages now. URLs use the absolute trailing-slash form so they match the canonicals.
 */
import type { MetadataRoute } from "next";
import { absoluteUrl } from "@nexoris/seo";
import { allHardcodedPages } from "../content/index.js";

export default function sitemap(): MetadataRoute.Sitemap {
  return allHardcodedPages.map((page) => ({
    url: absoluteUrl(page.meta.slug),
    changeFrequency: "monthly",
    priority: page.meta.slug === "/" ? 1 : 0.7,
  }));
}
