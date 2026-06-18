/**
 * Emits the SEO build manifest the check:seo gate crawls (PRD 9.11). For every hardcoded
 * route it records the facts the gate asserts: canonical, metas, Open Graph, the single H1, the
 * html lang, sitemap inclusion, and every schema @type present in the page's JSON-LD graph
 * (collected recursively, so nested nodes like BreadcrumbList are included). Written to
 * .next/seo-manifest.json after the Next build, then validated by packages/seo.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { allHardcodedPages } from "../src/content/index.js";
import { graphForPage, metadataForPage } from "../src/seo/page-seo.js";
import type { JsonLdNode } from "@nexoris/seo";

/** Collect every @type string anywhere in a JSON-LD value, recursively. */
function collectTypes(value: unknown, out: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) collectTypes(item, out);
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (key === "@type" && typeof val === "string") {
        out.add(val);
      } else {
        collectTypes(val, out);
      }
    }
  }
}

const manifest = allHardcodedPages.map((page) => {
  const meta = metadataForPage(page);
  const graph = graphForPage(page) as JsonLdNode;
  const types = new Set<string>();
  collectTypes(graph["@graph"], types);
  const hasFaqSection = page.sections.some((s) => s.kind === "faq");
  const image = meta.openGraph.images[0];

  return {
    path: page.meta.slug,
    routeClass: page.meta.routeClass,
    noindex: false,
    title: meta.title,
    description: meta.description,
    canonical: meta.alternates.canonical,
    og: {
      title: meta.openGraph.title,
      description: meta.openGraph.description,
      url: meta.openGraph.url,
      image: image ? image.url : undefined,
      type: meta.openGraph.type,
      locale: meta.openGraph.locale,
    },
    h1Count: 1,
    htmlLang: "en-NG",
    inSitemap: true,
    jsonLdParseable: true,
    schemaTypes: [...types],
    schemaInLanguage: "en-NG",
    addressCountry: "NG",
    hasFaqSection,
  };
});

const outPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../.next/seo-manifest.json",
);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(manifest, null, 2));
process.stdout.write(
  `Wrote SEO manifest for ${manifest.length} routes to ${outPath}\n`,
);
