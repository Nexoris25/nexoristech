/**
 * The check:seo rule engine for the Nexoris Technologies platform.
 *
 * Implements every rule in the Product Requirements Document, Part One, Section 9.11, run
 * over a build manifest of routes. Built before any page exists so every page is born
 * validating. A single failure blocks the merge. The engine is pure and unit-tested; the CLI
 * (cli.ts) crawls the manifest a page emits and reports the issues this engine finds.
 */
import { LOCALE, META_LIMITS } from "../constants.js";
import { absoluteUrl } from "../url.js";
import type { RouteClass } from "../types.js";

/** The Open Graph facts captured for a route. */
export interface ManifestOg {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  type?: string;
  locale?: string;
}

/** One route in the SEO build manifest. */
export interface SeoManifestEntry {
  /** The site path, for example "/about" or "/". */
  path: string;
  routeClass: RouteClass;
  /** Whether the page carries a robots noindex directive. */
  noindex: boolean;
  title: string;
  description: string;
  /** The canonical URL emitted on the page. */
  canonical: string;
  og: ManifestOg;
  /** The number of H1 elements rendered. */
  h1Count: number;
  /** The html lang attribute. */
  htmlLang: string;
  /** Whether the page is included in its sitemap group. */
  inSitemap: boolean;
  /** Whether the JSON-LD parsed cleanly. */
  jsonLdParseable: boolean;
  /** Every @type value present across the page's JSON-LD @graph. */
  schemaTypes: string[];
  /** The WebPage inLanguage value from the JSON-LD. */
  schemaInLanguage?: string;
  /** The Organization address country from the JSON-LD. */
  addressCountry?: string;
  /** Whether an FAQ section renders on the page. */
  hasFaqSection: boolean;
}

/**
 * A single SEO finding.
 *
 * An "error" blocks; a "warning" is reported and does not. The distinction earns its place now that
 * the gate covers CMS pages as well as hardcoded ones: a canonical pointing at the wrong URL is a
 * defect in the code and should stop a deploy, while a meta description a few characters under the
 * target is an editor's copy and should not. Everything is an error unless it is explicitly a
 * target rather than a limit.
 */
export type SeoSeverity = "error" | "warning";

export interface SeoIssue {
  path: string;
  rule: string;
  message: string;
  severity: SeoSeverity;
}

/** The site-wide schema nodes that must appear on every page (PRD 9.2). */
const REQUIRED_SITE_TYPES = [
  "Organization",
  "ProfessionalService",
  "WebSite",
  "Person",
];

/** The WebPage type or one of its subtypes must be present on every page. */
const WEBPAGE_TYPES = ["WebPage", "AboutPage", "ContactPage", "CollectionPage"];

/** The schema node a route class must additionally emit (PRD 9.2). */
function requiredRouteTypes(routeClass: RouteClass): string[] {
  switch (routeClass) {
    case "service":
    case "industry":
    case "pseo":
      return ["Service"];
    case "insight":
      return ["Article"]; // BlogPosting is accepted as an alternative below.
    case "author":
      return ["ProfilePage"];
    case "job":
      return ["JobPosting"];
    case "case-study":
      return ["Article"];
    default:
      return [];
  }
}

/** Validate one route against every per-page rule. */
export function validatePage(entry: SeoManifestEntry): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const add = (rule: string, message: string, severity: SeoSeverity = "error"): void => {
    issues.push({ path: entry.path, rule, message, severity });
  };
  const types = new Set(entry.schemaTypes);

  // Canonical present and correct.
  const expectedCanonical = absoluteUrl(entry.path);
  if (!entry.canonical) {
    add("canonical-present", "Canonical URL is missing.");
  } else if (entry.canonical !== expectedCanonical) {
    add(
      "canonical-correct",
      `Canonical is "${entry.canonical}" but should be "${expectedCanonical}".`,
    );
  }

  // Meta title within 60 characters.
  if (entry.title.length > META_LIMITS.titleMax) {
    add(
      "title-max",
      `Meta title is ${entry.title.length} characters; the maximum is ${META_LIMITS.titleMax}.`,
    );
  }

  // Meta description 155 to 160 characters, 160 the hard maximum.
  const descLength = entry.description.trim().length;
  if (descLength > META_LIMITS.descriptionMax) {
    add(
      "description-max",
      `Meta description is ${descLength} characters; the hard maximum is ${META_LIMITS.descriptionMax}.`,
    );
  } else if (descLength < META_LIMITS.descriptionMin) {
    add(
      "description-min",
      `Meta description is ${descLength} characters; the target minimum is ${META_LIMITS.descriptionMin}.`,
      // A target, not a limit: worth telling the editor, not worth stopping a deploy.
      "warning",
    );
  }

  // One unique H1.
  if (entry.h1Count !== 1) {
    add(
      "single-h1",
      `The page has ${entry.h1Count} H1 elements; there must be exactly one.`,
    );
  }

  // noindex and sitemap inclusion must agree.
  if (entry.inSitemap === entry.noindex) {
    add(
      "noindex-sitemap-agree",
      entry.noindex
        ? "Page is noindex but still appears in a sitemap."
        : "Page is indexable but missing from its sitemap.",
    );
  }

  // Complete Open Graph tags.
  const ogMissing: string[] = [];
  if (!entry.og.title) ogMissing.push("og:title");
  if (!entry.og.description) ogMissing.push("og:description");
  if (!entry.og.url) ogMissing.push("og:url");
  if (!entry.og.image) ogMissing.push("og:image");
  if (!entry.og.type) ogMissing.push("og:type");
  if (!entry.og.locale) ogMissing.push("og:locale");
  if (ogMissing.length > 0) {
    add("og-complete", `Missing Open Graph tags: ${ogMissing.join(", ")}.`);
  }

  // og:url equal to the canonical.
  if (entry.og.url && entry.canonical && entry.og.url !== entry.canonical) {
    add(
      "og-url-canonical",
      `og:url "${entry.og.url}" does not equal the canonical "${entry.canonical}".`,
    );
  }

  // At least one parseable JSON-LD block.
  if (!entry.jsonLdParseable) {
    add("jsonld-parseable", "The JSON-LD block did not parse.");
  }
  if (entry.schemaTypes.length === 0) {
    add("jsonld-present", "No JSON-LD nodes were emitted.");
  }

  // Required site-wide schema nodes.
  for (const type of REQUIRED_SITE_TYPES) {
    if (!types.has(type)) {
      add(
        "schema-site-node",
        `Missing the required site-wide schema node ${type}.`,
      );
    }
  }
  if (!WEBPAGE_TYPES.some((type) => types.has(type))) {
    add("schema-webpage", "Missing the WebPage node (or one of its subtypes).");
  }

  // Required per-route-class schema nodes.
  for (const type of requiredRouteTypes(entry.routeClass)) {
    const accepted =
      type === "Article"
        ? types.has("Article") || types.has("BlogPosting")
        : types.has(type);
    if (!accepted) {
      add(
        "schema-route-node",
        `Route class "${entry.routeClass}" must emit a ${type} node.`,
      );
    }
  }

  // BreadcrumbList on every non-home page.
  if (entry.path !== "/" && !types.has("BreadcrumbList")) {
    add("breadcrumb", "Every non-home page must emit a BreadcrumbList.");
  }

  // FAQPage present wherever an FAQ exists, and absent otherwise.
  const hasFaqSchema = types.has("FAQPage");
  if (entry.hasFaqSection && !hasFaqSchema) {
    add(
      "faq-schema-present",
      "An FAQ section renders but no FAQPage schema is emitted.",
    );
  }
  if (!entry.hasFaqSection && hasFaqSchema) {
    add(
      "faq-schema-absent",
      "FAQPage schema is emitted but no FAQ section renders.",
    );
  }

  // Locale facts: inLanguage en-NG and addressCountry NG.
  if (entry.htmlLang !== LOCALE) {
    add(
      "html-lang",
      `The html lang is "${entry.htmlLang}"; it must be "${LOCALE}".`,
    );
  }
  if (entry.schemaInLanguage && entry.schemaInLanguage !== LOCALE) {
    add(
      "schema-inlanguage",
      `Schema inLanguage is "${entry.schemaInLanguage}"; it must be "${LOCALE}".`,
    );
  }
  if (entry.addressCountry && entry.addressCountry !== "NG") {
    add(
      "address-country",
      `Schema addressCountry is "${entry.addressCountry}"; it must be "NG".`,
    );
  }

  return issues;
}

/** Validate the whole manifest: every per-page rule plus the no-duplicate-slugs rule. */
export function validateManifest(entries: SeoManifestEntry[]): SeoIssue[] {
  const issues: SeoIssue[] = [];
  for (const entry of entries) {
    issues.push(...validatePage(entry));
  }

  // No duplicate slugs: every canonical must be unique.
  const seen = new Map<string, string>();
  for (const entry of entries) {
    const key = entry.canonical || absoluteUrl(entry.path);
    const existing = seen.get(key);
    if (existing) {
      issues.push({
        path: entry.path,
        rule: "duplicate-slug",
        message: `Canonical "${key}" is shared with "${existing}".`,
        severity: "error",
      });
    } else {
      seen.set(key, entry.path);
    }
  }

  return issues;
}
