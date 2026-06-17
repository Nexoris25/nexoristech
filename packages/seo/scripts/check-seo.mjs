#!/usr/bin/env node
/**
 * check:seo gate.
 *
 * Stage 0 failing stub. In Stage 1 this becomes a real crawler over the build manifest that
 * asserts every rule in the Product Requirements Document, Part One, Section 9.11:
 * canonical present and correct, meta title within 60 characters, meta description between
 * 155 and 160 characters, one unique H1, correct noindex only where intended, sitemap
 * inclusion matching the noindex flag, complete Open Graph tags, at least one parseable
 * JSON-LD block, the required schema nodes per route class, BreadcrumbList on every
 * non-home page, FAQPage only where an FAQ section exists, inLanguage en-NG,
 * addressCountry NG, og:url equal to the canonical, and no duplicate slugs.
 *
 * It exits non-zero on purpose so the gate is wired and visible from the first day, and so no
 * one can mistake the unimplemented gate for a passing one.
 */
console.error(
  "check:seo is not implemented yet. This gate is built in Stage 1 (packages/seo) before any page exists.",
);
process.exit(1);
