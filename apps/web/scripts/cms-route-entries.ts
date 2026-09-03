/**
 * Manifest entries for the CMS-driven routes, read from the HTML the build actually produced.
 *
 * The gate has always understood these route classes: insight, author, case-study, job, pseo. It
 * simply never received any entries for them, because the manifest was built only from the
 * hardcoded pages. So every rule it enforces — canonical equals the page URL, title and description
 * within their limits, one H1, og:url matching the canonical, the schema types a route class must
 * emit, FAQPage present wherever an FAQ renders, noindex and sitemap agreeing — went unchecked on
 * exactly the pages an editor creates. Thirty-six routes were validated and none of them were
 * content.
 *
 * These facts are read out of the prerendered HTML rather than recomputed. That checks what really
 * ships: if a page renders two H1s, or a stored meta description is over the limit, the HTML says
 * so whatever the helper that produced it believed.
 *
 * A route that is server-rendered on demand has no HTML here and is not covered. Today every CMS
 * route class prerenders, and `expectedClasses` fails the build if a class disappears from the
 * output entirely, so this cannot quietly stop covering something.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { RouteClass } from "@nexoris/seo";

export interface CmsManifestEntry {
  path: string;
  routeClass: RouteClass;
  noindex: boolean;
  title: string;
  description: string;
  canonical: string;
  og: {
    title: string;
    description: string;
    url: string;
    image: string | undefined;
    type: string;
    locale: string;
  };
  h1Count: number;
  htmlLang: string;
  inSitemap: boolean;
  jsonLdParseable: boolean;
  schemaTypes: string[];
  schemaInLanguage?: string;
  addressCountry?: string;
  hasFaqSection: boolean;
}

/** Directory under .next/server/app, and the route class its pages belong to. */
const CLASSES: { dir: string; routeClass: RouteClass }[] = [
  { dir: "insights", routeClass: "insight" },
  // Case studies are deliberately absent. They are portfolio evidence reached from the listing, not
  // pages written to rank, so they carry no meta title or meta description and the gate has nothing
  // to check. Including them meant every build reported a missing description for content that is
  // not supposed to have one.
  { dir: "careers", routeClass: "job" },
];

const decode = (s: string): string =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&nbsp;/g, " ");

const attr = (html: string, re: RegExp): string => decode(re.exec(html)?.[1] ?? "");

const meta = (html: string, name: string): string =>
  attr(html, new RegExp(`<meta[^>]+name="${name}"[^>]+content="([^"]*)"`, "i"));

const ogTag = (html: string, prop: string): string =>
  attr(html, new RegExp(`<meta[^>]+property="og:${prop}"[^>]+content="([^"]*)"`, "i"));

/** Every @type anywhere in a JSON-LD value. */
function collectTypes(value: unknown, out: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) collectTypes(item, out);
    return;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === "@type" && typeof v === "string") out.add(v);
      else collectTypes(v, out);
    }
  }
}

/** The first value found for a key anywhere in a JSON-LD value. */
function findValue(value: unknown, key: string): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const hit = findValue(item, key);
      if (hit) return hit;
    }
    return undefined;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === key && typeof v === "string") return v;
      const hit = findValue(v, key);
      if (hit) return hit;
    }
  }
  return undefined;
}

function entryFor(html: string, path: string, routeClass: RouteClass, sitemap: string): CmsManifestEntry {
  const canonical = attr(html, /<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i);
  const robots = meta(html, "robots");

  const scripts = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  const types = new Set<string>();
  let parseable = true;
  let inLanguage: string | undefined;
  let addressCountry: string | undefined;
  for (const s of scripts) {
    try {
      const parsed: unknown = JSON.parse(decode(s[1] ?? ""));
      collectTypes(parsed, types);
      inLanguage ??= findValue(parsed, "inLanguage");
      addressCountry ??= findValue(parsed, "addressCountry");
    } catch {
      parseable = false;
    }
  }

  return {
    path,
    routeClass,
    noindex: /noindex/i.test(robots),
    title: decode(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? ""),
    description: meta(html, "description"),
    canonical,
    og: {
      title: ogTag(html, "title"),
      description: ogTag(html, "description"),
      url: ogTag(html, "url"),
      image: ogTag(html, "image") || undefined,
      type: ogTag(html, "type"),
      locale: ogTag(html, "locale"),
    },
    h1Count: (html.match(/<h1[\s>]/gi) ?? []).length,
    htmlLang: attr(html, /<html[^>]+lang="([^"]*)"/i),
    // The sitemap lists absolute URLs, so the canonical is exactly what to look for.
    inSitemap: canonical.length > 0 && sitemap.includes(`<loc>${canonical}</loc>`),
    jsonLdParseable: parseable,
    schemaTypes: [...types],
    ...(inLanguage ? { schemaInLanguage: inLanguage } : {}),
    ...(addressCountry ? { addressCountry } : {}),
    // The template renders the questions accordion only when the page has a stored FAQ set.
    hasFaqSection: /class="[^"]*\bfaq-block\b/i.test(html) || /id="faq-heading"/i.test(html),
  };
}

/**
 * Read every prerendered CMS page and turn it into a manifest entry.
 *
 * `appDir` is .next/server/app. Returns an empty list when the build output is not there, so a
 * partial build reports nothing rather than crashing; the caller decides whether that is a problem.
 */
export function cmsRouteEntries(appDir: string): CmsManifestEntry[] {
  if (!existsSync(appDir)) return [];
  const sitemapPath = join(appDir, "sitemap.xml.body");
  const sitemap = existsSync(sitemapPath) ? readFileSync(sitemapPath, "utf8") : "";

  const entries: CmsManifestEntry[] = [];

  /*
   * Author profiles are at the root, so they cannot be found by looking in a directory.
   *
   * They used to live under /authors and this scanner listed that folder. When they moved to
   * /<slug> the folder stopped existing, `existsSync` returned false, and the loop skipped it
   * silently — so every author page dropped out of the SEO gate without a single line of output
   * saying so. A scanner that reports nothing when it finds nothing is indistinguishable from one
   * that has nothing to find.
   *
   * A root-level page is an author profile when it says so in its own structured data. That is the
   * page describing itself rather than this script guessing from a path, which is what makes it
   * survive the next time a URL moves.
   */
  for (const file of readdirSync(appDir)) {
    if (!file.endsWith(".html")) continue;
    const html = readFileSync(join(appDir, file), "utf8");
    if (!/"@type"\s*:\s*"ProfilePage"/.test(html)) continue;
    const slug = file.replace(/\.html$/, "");
    entries.push(entryFor(html, `/${slug}`, "author", sitemap));
  }

  for (const { dir, routeClass } of CLASSES) {
    const full = join(appDir, dir);
    if (!existsSync(full)) continue;
    for (const file of readdirSync(full)) {
      if (!file.endsWith(".html")) continue;
      const slug = file.replace(/\.html$/, "");
      const html = readFileSync(join(full, file), "utf8");
      entries.push(entryFor(html, `/${dir}/${slug}`, routeClass, sitemap));
    }
  }
  return entries;
}

/** The route classes that produced at least one entry, for the caller to sanity-check coverage. */
export function coveredClasses(entries: CmsManifestEntry[]): string[] {
  return [...new Set(entries.map((e) => e.routeClass))].sort();
}
