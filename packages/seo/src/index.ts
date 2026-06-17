/**
 * @nexoris/seo
 *
 * The SEO engine for the Nexoris Technologies platform. Built before any page (delivery plan
 * Stage 1) so every page is born fast, accessible, and SEO valid: the JSON-LD @graph
 * builders, the buildMetadata helper, the branded Open Graph card generator, the split
 * sitemaps, robots.txt, and llms.txt.
 */

export const SEO_PACKAGE = "@nexoris/seo" as const;

export * from "./constants.js";
export * from "./types.js";
export * from "./url.js";
export * from "./metadata.js";
export * from "./schema/index.js";
export * from "./sitemap.js";
export * from "./robots.js";
export * from "./llms.js";
