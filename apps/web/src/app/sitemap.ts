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
  getInsightSlugs,
  getAuthorSlugs,
  getJobSlugs,
  getPseoSlugs,
} from "../lib/cms.js";

const LEGAL = ["/privacy-policy", "/terms-of-service", "/cookie-policy"];

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
    url: absoluteUrl(page.meta.slug),
    changeFrequency: "monthly",
    priority: page.meta.slug === "/" ? 1 : 0.7,
  }));

  const [insights, authors, jobs, pseo] = await Promise.all([
    getInsightSlugs(),
    getAuthorSlugs(),
    getJobSlugs(),
    getPseoSlugs(),
  ]);

  return [
    ...hardcoded,
    ...entries(["/insights", "/careers"], "weekly", 0.6),
    ...entries(LEGAL, "monthly", 0.3),
    ...entries(
      insights.map((s) => `/insights/${s}`),
      "weekly",
      0.6,
    ),
    ...entries(
      authors.map((s) => `/authors/${s}`),
      "monthly",
      0.4,
    ),
    ...entries(
      jobs.map((s) => `/careers/${s}`),
      "weekly",
      0.5,
    ),
    ...entries(
      pseo.map((s) => `/${s}`),
      "monthly",
      0.6,
    ),
  ];
}
